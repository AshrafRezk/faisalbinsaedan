import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  // Use Deno.env only — Netlify.env.get can hang the local :8888 proxy.
  const isPaymentDue = Deno.env.get("PAYMENT_DUE") === "true";

  if (isPaymentDue) {
    const url = new URL(request.url);
    const path = url.pathname;

    const isAllowedPath =
      path === "/payment-due.html" ||
      path.startsWith("/assets/") ||
      path.endsWith(".png") ||
      path.endsWith(".jpg") ||
      path.endsWith(".svg") ||
      path.endsWith(".css") ||
      path.endsWith(".js") ||
      path === "/favicon.ico";

    if (!isAllowedPath) {
      const redirectUrl = new URL("/payment-due.html", request.url);
      return context.rewrite(redirectUrl);
    }
  }

  return context.next();
};
