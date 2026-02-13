"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect when a component has mounted on the client.
 * Useful for preventing hydration mismatches when using client-only state (like localStorage).
 */
export function useMounted() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return mounted;
}
