'use client';

import { createContext, useMemo } from 'react';

// @project
import config from '@/components/saasable/config';
import useLocalStorage from '@/components/saasable/hooks/useLocalStorage';

/***************************  CONFIG CONTEXT  ***************************/

export const ConfigContext = createContext(undefined);

/***************************  CONFIG PROVIDER  ***************************/

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const { state, setState, setField, resetState } = useLocalStorage('sass-able-react-mui-next-js', config);

    const memoizedValue = useMemo(() => ({ state, setState, setField, resetState }), [state, setField, setState, resetState]);

    //@ts-ignore
    return <ConfigContext.Provider value={memoizedValue}>{children}</ConfigContext.Provider>;
}
