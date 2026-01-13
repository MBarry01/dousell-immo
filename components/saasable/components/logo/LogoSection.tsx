import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Link from 'next/link';

export default function LogoSection() {
    return (
        <Link href="/" style={{ textDecoration: 'none' }}>
            <Stack direction="row" alignItems="center" gap={1}>
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                    Doussel
                </Typography>
                <Typography variant="h4" color="text.primary" fontWeight={700}>
                    Immo
                </Typography>
            </Stack>
        </Link>
    );
}
