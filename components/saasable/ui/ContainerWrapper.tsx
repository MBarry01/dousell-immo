'use client';

// @mui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Container from '@mui/material/Container';

/***************************  MAIN - CONTAINER  ***************************/

export default function ContainerWrapper({ children, sx }: { children: React.ReactNode, sx?: any }) {
    const theme = useTheme();
    const upMD = useMediaQuery(theme.breakpoints.up('md'));
    const upXL = useMediaQuery(theme.breakpoints.up('xl'));
    const downMD = useMediaQuery(theme.breakpoints.down('md'));

    const isDesktop = (upMD || upXL) && !downMD;

    return (
        <Container maxWidth="lg" sx={{ px: { xs: 3, sm: 6, md: 6 }, ...sx }}>
            {children}
        </Container>
    );
}
