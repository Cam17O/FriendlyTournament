import { createTheme } from '@mui/material/styles';

// Thème Gamer avec couleurs néon
const gamerTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5B9FFF', // Bleu doux et lisible
      light: '#7BB3FF',
      dark: '#3D7FCC',
      contrastText: '#000000',
    },
    secondary: {
      main: '#ff006e', // Rose néon
      light: '#ff3399',
      dark: '#cc0059',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0e27', // Fond très sombre bleuté
      paper: '#151932', // Fond des cartes avec teinte bleue
    },
    text: {
      primary: '#ffffff', // Texte blanc
      secondary: '#b0b8d0', // Texte secondaire
    },
    divider: '#2d3a5e', // Bordures bleues
    action: {
      hover: '#1e2a4a', // Survol
      selected: '#5B9FFF', // Sélection bleu
      disabled: '#4a5568', // Désactivé
    },
    error: {
      main: '#ff1744',
      light: '#ff4569',
      dark: '#cc1236',
    },
    warning: {
      main: '#ffaa00',
      light: '#ffbb33',
      dark: '#cc8800',
    },
    info: {
      main: '#5B9FFF',
      light: '#7BB3FF',
      dark: '#3D7FCC',
    },
    success: {
      main: '#00ff88',
      light: '#33ff99',
      dark: '#00cc6d',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      color: '#5B9FFF',
      fontWeight: 700,
      textShadow: '0 0 10px rgba(91, 159, 255, 0.4)',
      letterSpacing: '0.5px',
    },
    h2: {
      color: '#ffffff',
      fontWeight: 600,
      textShadow: '0 0 8px rgba(91, 159, 255, 0.2)',
      letterSpacing: '0.3px',
    },
    h3: {
      color: '#ffffff',
      fontWeight: 600,
      letterSpacing: '0.3px',
    },
    h4: {
      color: '#ffffff',
      fontWeight: 600,
    },
    h5: {
      color: '#ffffff',
      fontWeight: 600,
    },
    h6: {
      color: '#5B9FFF',
      fontWeight: 600,
      letterSpacing: '0.3px',
    },
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: '#b0b8d0',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0e27',
          color: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#151932',
          borderBottom: '2px solid #5B9FFF',
          boxShadow: '0 4px 20px rgba(91, 159, 255, 0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#151932',
          border: '1px solid #2d3a5e',
          borderRadius: '12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#151932',
          border: '2px solid #2d3a5e',
          borderRadius: '12px',
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: '#5B9FFF',
            opacity: 0,
            transition: 'opacity 0.3s',
          },
          '&:hover': {
            borderColor: '#5B9FFF',
            boxShadow: '0 8px 32px rgba(91, 159, 255, 0.3), 0 0 20px rgba(91, 159, 255, 0.1)',
            transform: 'translateY(-4px)',
            '&::before': {
              opacity: 1,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          letterSpacing: '0.5px',
          transition: 'all 0.3s ease',
        },
        contained: {
          backgroundColor: '#5B9FFF',
          boxShadow: '0 4px 15px rgba(91, 159, 255, 0.4)',
          '&:hover': {
            backgroundColor: '#7BB3FF',
            boxShadow: '0 6px 20px rgba(91, 159, 255, 0.6)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: '#5B9FFF',
          borderWidth: '2px',
          color: '#5B9FFF',
          '&:hover': {
            borderColor: '#7BB3FF',
            backgroundColor: 'rgba(91, 159, 255, 0.1)',
            boxShadow: '0 4px 15px rgba(91, 159, 255, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
        text: {
          color: '#b0b8d0',
          '&:hover': {
            color: '#5B9FFF',
            backgroundColor: 'rgba(91, 159, 255, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0a0e27',
            borderRadius: '8px',
            '& fieldset': {
              borderColor: '#2d3a5e',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#5B9FFF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5B9FFF',
              boxShadow: '0 0 10px rgba(91, 159, 255, 0.3)',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b0b8d0',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#5B9FFF',
          },
          '& .MuiInputBase-input': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e2a4a',
          border: '1px solid #2d3a5e',
          color: '#ffffff',
          fontWeight: 600,
        },
        colorPrimary: {
          backgroundColor: '#5B9FFF',
          borderColor: '#5B9FFF',
          color: '#000000',
          boxShadow: '0 2px 8px rgba(91, 159, 255, 0.3)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '2px solid #2d3a5e',
        },
        indicator: {
          backgroundColor: '#5B9FFF',
          height: '3px',
          boxShadow: '0 0 10px rgba(91, 159, 255, 0.4)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#b0b8d0',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          letterSpacing: '0.5px',
          '&.Mui-selected': {
            color: '#5B9FFF',
            textShadow: '0 0 8px rgba(91, 159, 255, 0.4)',
          },
          '&:hover': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#151932',
          border: '2px solid #5B9FFF',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(91, 159, 255, 0.3)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#151932',
          border: '2px solid',
          borderRadius: '8px',
        },
        standardError: {
          borderColor: '#ff1744',
          backgroundColor: 'rgba(255, 23, 68, 0.1)',
        },
        standardSuccess: {
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0, 255, 136, 0.1)',
        },
        standardInfo: {
          borderColor: '#5B9FFF',
          backgroundColor: 'rgba(91, 159, 255, 0.1)',
        },
        standardWarning: {
          borderColor: '#ffaa00',
          backgroundColor: 'rgba(255, 170, 0, 0.1)',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#2d3a5e',
          borderWidth: '1px',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e2a4a',
          border: '2px solid #5B9FFF',
        },
      },
    },
  },
});

export default gamerTheme;

