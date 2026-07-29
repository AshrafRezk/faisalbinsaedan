# flippy-pdf — an Issuu-style PDF flipbook viewer

A small, reusable JavaScript library that turns any PDF into an Issuu-style
two-page flipbook with drag-to-flip, keyboard navigation, fullscreen, and
zoom. No framework dependency — drop it into any page. Mobile-friendly:
collapses to a single-page slide layout under 900px.

## Preview the sample

The repo ships with `sample.pdf` and a Vite dev server wired up to it.

### 1. Install

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
# or: npm run serve / npm start
```

Vite will open `http://localhost:5173` in your browser. The sample PDF is
loaded automatically.

> **Heads up:** the sample PDF is ~33 MB. The first page renders in
> ~1 second; the rest stream in priority order while you read.

### 3. Build a static bundle (optional)

```bash
npm run build
npm run preview
```

`npm run build` outputs an optimized bundle to `dist/`, and `npm run preview`
serves that bundle locally so you can sanity-check the production build.

## Controls

| Action            | Mouse / Touch                  | Keyboard            |
| ----------------- | ------------------------------ | ------------------- |
| Next spread       | Click right-side arrow         | `→` `Space` `PgDn`  |
| Previous spread   | Click left-side arrow          | `←` `PgUp`          |
| Drag-to-flip      | Click & drag a page sideways   | —                   |
| Jump to page      | Type a number in the toolbar   | —                   |
| Fullscreen        | Toolbar button                 | `F`                 |
| Zoom              | Toolbar `+` / `−` / reset      | —                   |
| First / last page | —                              | `Home` / `End`      |

## Use the library in your own project

The library is published under `./src/index.js` and the styles under
`./src/flipbook.css`.

```html
<link rel="stylesheet" href="/path/to/flipbook.css" />
<div id="my-flipbook" style="width: 100%; height: 100vh;"></div>

<script type="module">
  import { Flipbook } from '/path/to/flipbook.js';

  const fb = new Flipbook({ container: '#my-flipbook' });
  await fb.load('/path/to/your.pdf');
</script>
```

If you bundle with Vite/webpack/Rollup, the same import works:

```js
import { Flipbook } from 'flippy-pdf';
import 'flippy-pdf/style.css';

const fb = new Flipbook({ container: document.getElementById('viewer') });

// Any URL works — local path, absolute, S3 presigned URL, CDN, etc.
fb.load('https://my-bucket.s3.amazonaws.com/magazines/issue-03.pdf');
```

**Remote PDFs and CORS.** PDF.js fetches the document via XHR/fetch, so the
host (S3, CloudFront, your own server) must send permissive CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```

For an S3 bucket, add a CORS rule that allows `GET` from your origin. For
S3 *presigned* URLs no extra setup is needed beyond the bucket CORS config.

### PDF.js worker setup

The library uses PDF.js, which runs its parser in a Web Worker. **You must
configure a worker URL before calling `load()`** — there is no built-in CDN
default. `load()` will throw with a setup hint if you forget.

The simplest setup uses the worker bundled with this package:

```js
import { Flipbook, setWorkerSrc } from 'flippy-pdf';
import workerUrl from 'flippy-pdf/worker?url'; // Vite / Rollup / esbuild
setWorkerSrc(workerUrl);
```

Other options:

```js
// Vite / Rollup — point at pdfjs-dist's worker directly
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
setWorkerSrc(workerUrl);

// Webpack 5+ (asset modules)
setWorkerSrc(new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href);

// Self-hosted file
setWorkerSrc('/static/pdf.worker.min.mjs');

// CDN (no bundler)
setWorkerSrc('https://cdn.jsdelivr.net/npm/pdfjs-dist@4/build/pdf.worker.min.mjs');
```

You can also pass it per-instance via the `workerSrc` constructor option.

### Content-Security-Policy

PDF.js runs in a Web Worker and the rendered pages are blitted to the DOM
as `blob:` object URLs. If your site sends a CSP, allow both:

```
worker-src 'self' blob:;
img-src    'self' blob: data:;
```

`worker-src 'self'` covers the bundled-and-served worker file; `blob:` is
required because PDF.js may also spawn a small bootstrap worker via
`URL.createObjectURL(...)`. `img-src blob:` is needed because each page is
exported via `canvas.toBlob()` and used as a CSS `background-image`.

Setting `worker-src` explicitly is safer than relying on the
`default-src → worker-src` fallback chain, which differs between browsers.

## API

### `new Flipbook(options)`

| Option           | Type                       | Default               | Notes                                                |
| ---------------- | -------------------------- | --------------------- | ---------------------------------------------------- |
| `container`      | `string \| HTMLElement`    | required              | Selector or element to mount the viewer into.       |
| `pdfUrl`         | `string`                   | —                     | If provided, you can call `load()` with no args.     |
| `renderScale`    | `number`                   | `~devicePixelRatio`   | Render scale for PDF.js. Higher = sharper, slower.  |
| `flipDuration`   | `number` (ms)              | `700`                 | Page-flip animation duration.                       |
| `enableDrag`     | `boolean`                  | `true`                | Drag a page edge to flip.                           |
| `enableKeyboard` | `boolean`                  | `true`                | Listen on `document` for arrow / page keys.         |
| `singlePageBreakpoint` | `number` (px)        | `900`                 | Below this stage width, layout switches to one-page-at-a-time with a horizontal slide. |
| `workerSrc`      | `string`                   | required              | PDF.js worker URL. Set globally with `setWorkerSrc()` or per-instance. See "PDF.js worker setup" above. |

### Methods

- `await flipbook.load(pdfUrl?)` — load a PDF (returns `this`). Rejects if the PDF can't be fetched, parsed, or if no worker is configured; the viewer also shows an error state in the loader overlay.
- `flipbook.next()` — advance one spread.
- `flipbook.prev()` — go back one spread.
- `flipbook.goTo(page)` — jump to the spread containing `page` (1-indexed).
- `flipbook.destroy()` — tear down DOM, revoke object URLs, free PDF.

### How spreads work

Like a real magazine: the cover (page 1) is shown alone on the right of an
empty left half, then pages 2–3, 4–5, … pair up. If the document has an even
number of pages, the back cover sits alone on the left of the final spread.

### Responsive layout

On stage widths below `singlePageBreakpoint` (default `900px`) — phones and
tablets in portrait — the layout collapses to **one page at a time** and the
flip becomes a horizontal slide. Above the breakpoint, the standard two-page
magazine spread is shown. Mode is re-evaluated on resize, so rotating a
device or resizing the window swaps layouts on the fly and preserves the
current page.

## How it works (briefly)

- PDF rendering: [PDF.js](https://mozilla.github.io/pdf.js/) renders each
  page off-screen to a canvas, which is converted to a JPEG `Blob` and stored
  as an object URL. Pages render in priority order (cover → current spread →
  rest) so the reader can start flipping almost immediately.
- The flip itself is a single `<div>` ("the leaf") with two faces, rotated
  around the spine using CSS 3D transforms. Drag-to-flip drives the rotation
  in real time from pointer events; release-without-completion snaps back.
- Backface culling and a soft gradient on each face give the curl shadow.

## Browser support

Anything modern: Chrome, Firefox, Safari, Edge. Requires CSS 3D transforms,
`backface-visibility`, ES modules, and `ResizeObserver` — all baseline since
~2020.

## Project layout

```
flippy-pdf/
├── index.html         # Demo page
├── package.json
├── vite.config.js
├── public/
│   └── sample.pdf     # The bundled sample (served at /sample.pdf)
└── src/
    ├── index.js       # Library entry
    ├── flipbook.js    # The Flipbook class
    └── flipbook.css   # Widget styles
```

## License

MIT.
