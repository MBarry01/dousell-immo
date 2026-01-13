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
            <CardMedia
                {...(cardMediaProps?.component == 'img'
                    ? { src: GetImagePath(image), alt: 'Graphics', loading: 'lazy' }
                    : { image: GetImagePath(image), title: 'Graphics', loading: 'lazy' })}
                sx={{ width: 'auto', ...sx }}
                {...cardMediaProps}
            >
                {children}
            </CardMedia>
        );
    }

    return image;
}
