'use client';
import { use } from 'react';

// @project
import { ConfigContext } from '@/components/saasable/contexts/ConfigContext';

/***************************  HOOKS - CONFIG  ***************************/

export default function useConfig() {
    const context = use(ConfigContext);

    if (!context) throw new Error('useConfig must be use inside ConfigProvider');

    return context;
}
