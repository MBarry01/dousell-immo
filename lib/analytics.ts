/**
 * Analytics utilities for tracking user interactions
 *
 * Extended with workflow events per WORKFLOW_PROPOSAL.md section 10.2
 *
 * Features:
 * - Client-side: Google Analytics + localStorage debug
 * - Server-side: Structured console logging (parseable)
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ============================================
// SERVER-SIDE TRACKING (for Server Actions)
// ============================================

/**
 * Track event from server-side code
 * Outputs structured logs for log aggregation (Vercel, Datadog, etc.)
 */
export function trackServerEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    type: "ANALYTICS",
    event,
    properties,
    timestamp,
    env: process.env.NODE_ENV,
  };

  // Structured logging (parseable by log aggregators)
  console.log(JSON.stringify(logEntry));
}

// ============================================
// WORKFLOW EVENTS (WORKFLOW_PROPOSAL.md 10.2)
// ============================================

export const EVENTS = {
  // Registration events
  REGISTER_STARTED: "register.started",
  REGISTER_COMPLETED: "register.completed",
  REGISTER_FAILED: "register.failed",

  // Login events (CRITICAL for debugging)
  LOGIN_STARTED: "login.started",
  LOGIN_SUCCESS: "login.success",
  LOGIN_FAILED: "login.failed",

  // Redirect events (CRITICAL for debugging loops)
  REDIRECT_EXECUTED: "redirect.executed",

  // Pro wizard events
  PRO_WIZARD_STEP_VIEWED: "pro_wizard.step_viewed",
  PRO_WIZARD_STEP_COMPLETED: "pro_wizard.step_completed",
  PRO_WIZARD_ABANDONED: "pro_wizard.abandoned",
  PRO_WIZARD_COMPLETED: "pro_wizard.completed",

  // Conversion events
  UPGRADE_CTA_CLICKED: "upgrade.cta_clicked",
  UPGRADE_COMPLETED: "upgrade.completed",

  // Tenant activation events
  TENANT_MAGIC_LINK_SENT: "tenant.magic_link_sent",
  TENANT_ACTIVATED: "tenant.activated",
  TENANT_VERIFICATION_FAILED: "tenant.verification_failed",

  // Favorites events
  FAVORITES_ANONYMOUS_ADDED: "favorites.anonymous_added",
  FAVORITES_SYNC_PROMPTED: "favorites.sync_prompted",
  FAVORITES_SYNC_COMPLETED: "favorites.sync_completed",

  // Role switch events
  ROLE_SWITCHED: "role.switched",

  // Subscription events
  SUBSCRIPTION_EXPIRED: "subscription.expired",
  SUBSCRIPTION_REACTIVATED: "subscription.reactivated",
} as const;

/**
 * Track a workflow event
 *
 * @param event - Event name from EVENTS constant
 * @param properties - Event properties
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const eventData = {
    event,
    properties,
    timestamp,
    url: typeof window !== "undefined" ? window.location.pathname : "server",
  };

  // Development: Log to console
  if (process.env.NODE_ENV === "development") {
    console.log("📊 [Analytics]", event, properties);
  }

  // Google Analytics
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", event, {
      ...properties,
      timestamp,
    });
  }

  // Store locally for debugging (last 50 events)
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem("_analytics_debug") || "[]");
      stored.push(eventData);
      if (stored.length > 50) stored.shift();
      localStorage.setItem("_analytics_debug", JSON.stringify(stored));
    } catch {
      // Ignore localStorage errors
    }
  }
}

/**
 * Identify user for analytics
 */
export function identifyUser(
  userId: string,
  traits?: {
    email?: string;
    name?: string;
    pro_status?: string;
    user_type?: string;
  }
): void {
  if (process.env.NODE_ENV === "development") {
    console.log("👤 [Identify]", userId, traits);
  }

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("set", "user_properties", {
      user_id: userId,
      ...traits,
    });
  }
}

/**
 * Get debug events from localStorage
 */
export function getDebugEvents(): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("_analytics_debug") || "[]");
  } catch {
    return [];
  }
}

// ============================================
// WORKFLOW HELPER FUNCTIONS
// Per WORKFLOW_PROPOSAL.md section 10.2
// ============================================

/**
 * Track login success
 */
export function trackLoginSuccess(params: {
  method: "email" | "google" | "magic_link";
  user_type: "prospect" | "owner" | "tenant" | "team_member";
  has_next_param: boolean;
  user_id?: string;
}) {
  trackEvent(EVENTS.LOGIN_SUCCESS, params);
}

/**
 * Track redirect execution (for debugging redirect loops)
 */
export function trackRedirect(params: {
  from: string;
  to: string;
  reason: string;
  user_roles?: string[];
  pro_status?: string;
}) {
  trackEvent(EVENTS.REDIRECT_EXECUTED, params);
}

/**
 * Track Pro wizard step completion
 */
export function trackProWizardStep(params: {
  step: number;
  step_name: string;
  duration_ms?: number;
}) {
  trackEvent(EVENTS.PRO_WIZARD_STEP_COMPLETED, params);
}

/**
 * Track upgrade completion (Prospect → Pro)
 */
export function trackUpgradeCompleted(params: {
  from: "bienvenue" | "compte" | "vitrine" | "cta";
  plan?: string;
}) {
  trackEvent(EVENTS.UPGRADE_COMPLETED, params);
}

/**
 * Track tenant magic link sent
 */
export function trackTenantMagicLinkSent(params: {
  lease_id: string;
  sent_by: string;
}) {
  trackEvent(EVENTS.TENANT_MAGIC_LINK_SENT, params);
}

/**
 * Track tenant activation (first successful access)
 */
export function trackTenantActivated(params: {
  lease_id: string;
  verification_required: boolean;
}) {
  trackEvent(EVENTS.TENANT_ACTIVATED, params);
}

/**
 * Track favorites sync completed
 */
export function trackFavoritesSync(params: {
  count: number;
  source: "login" | "register" | "manual";
}) {
  trackEvent(EVENTS.FAVORITES_SYNC_COMPLETED, params);
}

/**
 * Track role switch (Owner ↔ Tenant)
 */
export function trackRoleSwitch(params: {
  from: "gestion" | "locataire";
  to: "gestion" | "locataire";
}) {
  trackEvent(EVENTS.ROLE_SWITCHED, params);
}

/**
 * Track subscription expired
 */
export function trackSubscriptionExpired(params: {
  user_id: string;
  expired_at: string;
}) {
  trackEvent(EVENTS.SUBSCRIPTION_EXPIRED, params);
}

/**
 * Track anonymous favorite added (for conversion tracking)
 */
export function trackAnonymousFavorite(params: {
  property_id: string;
  favorites_count: number;
}) {
  trackEvent(EVENTS.FAVORITES_ANONYMOUS_ADDED, params);
}

/**
 * Track favorites sync prompt shown
 */
export function trackFavoritesSyncPrompt(params: {
  favorites_count: number;
  threshold: 3 | 5 | 10;
}) {
  trackEvent(EVENTS.FAVORITES_SYNC_PROMPTED, params);
}

// ============================================
// LEGACY CONTACT EVENTS
// ============================================

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
