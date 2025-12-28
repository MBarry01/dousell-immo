type GTMEvent = {
    event: string;
    [key: string]: unknown;
};

declare global {
    interface Window {
        dataLayer?: Record<string, unknown>[];
    }
}

export const sendGTMEvent = (eventName: string, data?: object) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            event: eventName,
            ...data,
        });
    } else {
        console.log(`[GTM] Event Fired (Dev): ${eventName}`, data);
    }
};
