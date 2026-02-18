'use client';

// @mui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { IconSparkles, IconX, IconCheck } from '@tabler/icons-react';

//@project
import { IconType } from '@/components/saasable/enum';

const icons: Record<string, any> = {
    'tabler-sparkles': IconSparkles,
    'tabler-x': IconX,
    'tabler-check': IconCheck,
};

export default function SvgIcon({ name, size = 24, type = IconType.STROKE, color, stroke, twoToneColor }: { name: string, size?: number, type?: IconType, color?: string, stroke?: number, twoToneColor?: string }) {
    const _theme = useTheme();

    const Icon = icons[name];

    if (!Icon) return null;

    return (
        <Box
            role="none"
            sx={{
                '& svg': {
                    verticalAlign: 'middle',
                    display: 'block',
                    color: color || (type === IconType.CUSTOM ? 'text.primary' : 'primary.main'),
                }
            }}
        >
            <Icon size={size} stroke={stroke || 1.5} color={color} />
        </Box>
    );
}
