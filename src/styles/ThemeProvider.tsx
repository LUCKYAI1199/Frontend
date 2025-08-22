import React, { createContext, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

// Define the theme structure
interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    danger: string;
    error: string;
    warning: string;
    info: string;
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      card: string;
      overlay: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      inverse: string;
    };
    border: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    charts: {
      bullish: string;
      bearish: string;
      neutral: string;
      volume: string;
      grid: string;
    };
    status: {
      itm: string;
      atm: string;
      otm: string;
      highOI: string;
      highVolume: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
    wide: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    round: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    fast: string;
    medium: string;
    slow: string;
  };
  zIndex: {
    dropdown: number;
    sticky: number;
    fixed: number;
    modal: number;
    overlay: number;
    tooltip: number;
  };
}

// Define the dark theme (matching original design)
const darkTheme: Theme = {
  colors: {
    primary: '#0f0', // Lime green primary
    secondary: '#4169e1', // Royal blue secondary
    success: '#10b981', // Green
    danger: '#ef4444', // Red
    error: '#ef4444', // Red (alias for danger)
    warning: '#f59e0b', // Orange
    info: '#06b6d4', // Cyan
    background: {
      primary: '#1a1a1a', // Main background
      secondary: '#232323', // Card background
      tertiary: '#2d2d2d', // Elevated background
      card: '#181818', // Card hover
      overlay: 'rgba(24, 24, 24, 0.98)', // Modal overlay
    },
    text: {
      primary: '#e0e0e0', // Primary text
      secondary: '#aaa', // Secondary text
      tertiary: '#999', // Tertiary text
      inverse: '#222', // Dark text on light backgrounds
    },
    border: {
      primary: '#333', // Primary borders
      secondary: '#444', // Secondary borders
      tertiary: '#555', // Tertiary borders
    },
    charts: {
      bullish: '#10b981', // Green for bullish candles
      bearish: '#ef4444', // Red for bearish candles
      neutral: '#6b7280', // Gray for neutral
      volume: '#8b5cf6', // Purple for volume
      grid: '#333', // Grid lines
    },
    status: {
      itm: '#888', // Gray for ITM
      atm: '#4169e1', // Royal blue for ATM
      otm: '#ffd699', // Light orange for OTM
      highOI: 'rgba(255, 0, 0, 0.08)', // Red background for high OI
      highVolume: 'rgba(0, 255, 0, 0.08)', // Green background for high volume
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1440px',
    wide: '1920px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    round: '50%',
  },
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.2)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.3)',
  },
  transitions: {
    fast: '0.15s ease',
    medium: '0.3s ease',
    slow: '0.5s ease',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1010,
    fixed: 1020,
    modal: 1030,
    overlay: 1040,
    tooltip: 1050,
  },
};

// Extend styled-components DefaultTheme
declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

// Create theme context
const ThemeContext = createContext<Theme>(darkTheme);

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme provider component
interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme = darkTheme,
}) => {
  return (
    <ThemeContext.Provider value={theme}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Export theme for direct usage
export { darkTheme };
export type { Theme };
