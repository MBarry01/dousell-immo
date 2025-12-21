type GTMEvent = {
    event: string;
    [key: string]: any;
};

export const sendGTMEvent = (eventName: string, data?: object) => {
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
            event: eventName,
            ...data,
        });
    } else {
        console.log(`[GTM] Event Fired (Dev): ${eventName}`, data);
    }
};
