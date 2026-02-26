'use client';

import { isValidElement } from 'react';

// @mui
import CardMedia from '@mui/material/CardMedia';

// @project
import GetImagePath from '@/components/saasable/utils/GetImagePath';

/***************************  DYNAMIC GRAPHICS - IMAGE  ***************************/

export default function GraphicsImage({ children, image, sx, cardMediaProps }: any) {
    if (isValidElement(image)) return image;

    // Simplified: only support string images (paths) or image objects with src
    if (typeof image === 'string') {
        return (
            <img
                src={GetImagePath(image)}
                alt="Graphics"
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain', ...sx }}
                {...cardMediaProps}
            />
        );
    }

    return image;
}
