/**
 * Analytics utilities for tracking user interactions
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export interface ContactEvent {
  property_id: string;
  property_title: string;
  category: "contact";
  label: "Phone" | "WhatsApp" | "Email";
}

export const analyticsEvents = {
  /**
   * Track contact phone call click
   */
  contactCall: (propertyId: string, propertyTitle: string) => {
    const eventData: ContactEvent = {
      property_id: propertyId,
      property_title: propertyTitle,
      category: "contact",
      label: "Phone",
    };

    // Google Analytics 4 (gtag)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "contact_click", {
        event_category: "Contact",
        event_label: "Phone Call",
        property_id: propertyId,
        property_title: propertyTitle,
        category: "contact",
        label: "Phone",
      });
    }

    // Console log for debugging
    console.log("Phone call tracked:", eventData);

    // You can add other analytics services here (e.g., Mixpanel, Amplitude, etc.)
    // Example:
    // if (typeof window !== "undefined" && (window as any).mixpanel) {
    //   (window as any).mixpanel.track("Contact Phone Call", eventData);
    // }
  },

  /**
   * Track contact WhatsApp click
   */
  contactWhatsApp: (propertyId: string, propertyTitle: string) => {
    const eventData: ContactEvent = {
      property_id: propertyId,
      property_title: propertyTitle,
      category: "contact",
      label: "WhatsApp",
    };

    // Google Analytics 4 (gtag)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "contact_click", {
        event_category: "Contact",
        event_label: "WhatsApp",
        property_id: propertyId,
        property_title: propertyTitle,
        category: "contact",
        label: "WhatsApp",
      });
    }

    // Console log for debugging
    console.log("WhatsApp contact tracked:", eventData);
  },

  /**
   * Track contact email click
   */
  contactEmail: (propertyId: string, propertyTitle: string) => {
    const eventData: ContactEvent = {
      property_id: propertyId,
      property_title: propertyTitle,
      category: "contact",
      label: "Email",
    };

    // Google Analytics 4 (gtag)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "contact_click", {
        event_category: "Contact",
        event_label: "Email",
        property_id: propertyId,
        property_title: propertyTitle,
        category: "contact",
        label: "Email",
      });
    }

    // Console log for debugging
    console.log("Email contact tracked:", eventData);
  },

  /**
   * Track estimation wizard start
   */
  estimateStart: () => {
    // Google Analytics 4 (gtag)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "estimation_start", {
        event_category: "Estimation",
        event_label: "Wizard Started",
      });
    }

    // Console log for debugging
    console.log("Estimation wizard start tracked");
  },

  /**
   * Track estimation wizard completion
   */
  estimateComplete: (type: string, quartier: string) => {
    // Google Analytics 4 (gtag)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "estimation_complete", {
        event_category: "Estimation",
        event_label: "Wizard Completed",
        property_type: type,
        quartier: quartier,
      });
    }

    // Console log for debugging
    console.log("Estimation wizard completed:", { type, quartier });
  },
};
