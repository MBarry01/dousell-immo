'use client';

// @mui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/***************************  COMPONENT - TYPESET  ***************************/

export default function Typeset({ heading, caption, stackProps }: any) {
    return (
        <Stack spacing={1} {...stackProps}>
            {heading && (
                <Typography variant="h2" sx={{ fontWeight: 700 }}>
                    {heading}
                </Typography>
            )}
            {caption && (
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {caption}
                </Typography>
            )}
        </Stack>
    );
}
