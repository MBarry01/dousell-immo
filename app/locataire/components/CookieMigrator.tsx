'use client';

import { useEffect, useRef } from 'react';
import { migrateTenantCookie } from '../actions';

/**
 * Client component that migrates tenant session cookie on mount.
 *
 * This ensures the cookie has the correct path (/) so it's sent
 * to API routes like /api/stripe/rent-checkout.
 *
 * Runs once per page load, silently in the background.
 */
export function CookieMigrator() {
    const hasMigrated = useRef(false);

    useEffect(() => {
        if (hasMigrated.current) return;
        hasMigrated.current = true;

        // Migrate cookie in background (no UI impact)
        migrateTenantCookie().catch(console.error);
    }, []);

    return null;
}
