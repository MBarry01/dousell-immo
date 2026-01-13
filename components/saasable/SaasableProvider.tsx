'use client';

import { Suspense, useEffect, useState } from 'react';

// @mui
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// @project
import Loader from '@/components/saasable/ui/Loader';
import { ConfigProvider } from '@/components/saasable/contexts/ConfigContext';
import ThemeCustomization from '@/components/saasable/theme';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const [loader, setLoader] = useState(true);
    const theme = ThemeCustomization();

    useEffect(() => {
        setLoader(false);
    }, []);

    return (
        <>
            <InitColorSchemeScript attribute="data-ai-color-scheme" defaultMode="dark" />
            <Suspense fallback={<Loader />}>
                {loader ? (
                    <Loader />
                ) : (
                    <MuiThemeProvider disableTransitionOnChange theme={theme} defaultMode="dark">
                        <CssBaseline enableColorScheme />
                        {children}
                    </MuiThemeProvider>
                )}
            </Suspense>
        </>
    );
}

export default function SaasableProvider({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider>
            <ConfigProvider>
                <ThemeWrapper>{children}</ThemeWrapper>
            </ConfigProvider>
        </AppRouterCacheProvider>
    );
}
