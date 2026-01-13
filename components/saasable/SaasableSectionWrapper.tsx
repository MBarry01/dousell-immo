'use client';

import { Suspense, useEffect, useState } from 'react';

// @mui - Using a minimal approach to avoid global style pollution
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

// @project
import { ConfigProvider } from '@/components/saasable/contexts/ConfigContext';

// Inline minimal dark theme to avoid the complex theme with global effects
const minimalDarkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#F4C430',
        },
        background: {
            default: '#000000',
            paper: '#1a1a1a',
        },
        grey: {
            100: '#1a1a1a',
            200: '#2a2a2a',
            300: '#3a3a3a',
            400: '#4a4a4a',
            900: '#0a0a0a',
        },
        text: {
            primary: '#ffffff',
            secondary: '#a0a0a0',
        }
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
        // Disable MUI's global CSSBaseline effects
        MuiCssBaseline: {
            styleOverrides: {
                // Don't inject any global styles
            }
        }
    }
});

function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div style={{ minHeight: '400px' }} />;
    }

    // Note: Removed AppRouterCacheProvider as it injects global Emotion styles
    // Using a minimal MUI theme provider that doesn't pollute global CSS
    return (
        <MuiThemeProvider theme={minimalDarkTheme}>
            {/* Scoped container to isolate MUI styles */}
            <div className="saasable-scope" style={{ isolation: 'isolate' }}>
                {children}
            </div>
        </MuiThemeProvider>
    );
}

export default function SaasableSectionWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ConfigProvider>
            <ThemeWrapper>{children}</ThemeWrapper>
        </ConfigProvider>
    );
}
