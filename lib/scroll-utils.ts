/**
 * Scrolls the page to the top.
 * Handles both the window (standard) and the internal scroll container 
 * used in the Workspace and WebApp layouts (#main-scroll-container).
 */
export const scrollToTop = (behavior: ScrollBehavior = "instant") => {
    // 1. Standard window scroll
    window.scrollTo({ top: 0, behavior });

    // 2. Custom scroll container used in dashboard layouts
    const scrollContainer = document.getElementById("main-scroll-container");
    if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior });
    }

    // 3. Fallback for body/html in some mobile browsers
    document.body.scrollTop = 0;
    if (document.documentElement) {
        document.documentElement.scrollTop = 0;
    }
};
