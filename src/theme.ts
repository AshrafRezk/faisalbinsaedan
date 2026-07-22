import { createTheme, type Direction } from '@mui/material/styles'

const sharedThemeOptions = {
  palette: {
    primary: {
      main: '#1a365d',
      light: '#2c5282',
      dark: '#0f1f3a',
    },
    secondary: {
      main: '#2c5282',
      light: '#799fbc',
      dark: '#1a365d',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#4a5568',
    },
    success: {
      main: '#38a169',
      light: '#f0fff4',
    },
    warning: {
      main: '#c05621',
      light: '#fffaf0',
    },
    error: {
      main: '#c53030',
      light: '#fff5f5',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
} as const

export function createAppTheme(direction: Direction) {
  const isRtl = direction === 'rtl'

  return createTheme({
    ...sharedThemeOptions,
    direction,
    typography: {
      fontFamily: isRtl
        ? '"PP Neue Montreal Arabic", system-ui, sans-serif'
        : '"PP Telegraf", system-ui, sans-serif',
      h1: {
        fontWeight: isRtl ? 700 : 600,
        fontSize: '2rem',
      },
      h2: {
        fontWeight: isRtl ? 700 : 600,
        fontSize: '1.5rem',
      },
      h3: {
        fontWeight: isRtl ? 600 : 600,
        fontSize: '1.25rem',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
  })
}

/** Default theme for type inference / tests */
export const theme = createAppTheme('rtl')
