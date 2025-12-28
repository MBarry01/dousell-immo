type GTMEvent = {
    event: string;
    [key: string]: unknown;
};

interface WindowWithDataLayer extends Window {
    dataLayer?: unknown[];
}

export const sendGTMEvent = (eventName: string, data?: object) => {
    if (typeof window !== 'undefined' && (window as WindowWithDataLayer).dataLayer) {
        (window as WindowWithDataLayer).dataLayer?.push({
            event: eventName,
            ...data,
        });
    } else {
        console.log(`[GTM] Event Fired (Dev): ${eventName}`, data);
    }
};
