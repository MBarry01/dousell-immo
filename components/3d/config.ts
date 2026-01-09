/**
 * Configuration globale pour l'expérience 3D
 * Modifiez ces valeurs pour ajuster les animations sans toucher au code
 */

export const HOUSE_3D_CONFIG = {
  // ========== MODÈLE 3D ==========
  model: {
    path: "/3D/house.glb",
    scale: 1.5,
    initialPosition: {
      x: 0,
      y: 0,
      z: 0,
    },
  },

  // ========== CAMÉRA ==========
  camera: {
    position: [0, 0, 5] as [number, number, number],
    fov: 50, // Field of view (angle de vue)
  },

  // ========== LUMIÈRES ==========
  lights: {
    ambient: {
      intensity: 0.5,
    },
    directional: {
      intensity: 1,
      position: [5, 5, 5] as [number, number, number],
    },
    // Lumière secondaire (optionnelle)
    directional2: {
      intensity: 0.3,
      position: [-5, -5, -5] as [number, number, number],
    },
  },

  // ========== ENVIRONNEMENT ==========
  environment: {
    preset: "city" as const, // "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment"
  },

  // ========== EFFET FLOAT ==========
  float: {
    enabled: true,
    speed: 2, // Vitesse de l'oscillation
    rotationIntensity: 0.5, // Intensité de la rotation
    floatIntensity: 0.5, // Amplitude du mouvement vertical
  },

  // ========== ANIMATION : ROTATION INFINIE ==========
  rotation: {
    enabled: true,
    duration: 20, // Durée d'un tour complet (en secondes)
    ease: "linear" as const, // Type d'easing GSAP
  },

  // ========== ANIMATION : TRANSITION AU SCROLL ==========
  scrollTransition: {
    enabled: true,
    // ID de la section qui déclenche la transition
    triggerSelector: "#saas-section",
    // Quand commence l'animation (par rapport au déclencheur)
    start: "top bottom",
    // Quand finit l'animation
    end: "top top",
    // Synchronisation avec le scroll
    scrub: true,
    // Position finale
    finalPosition: {
      x: -2, // Décalage horizontal (- = gauche, + = droite)
      z: 1,  // Profondeur (- = arrière, + = avant/zoom)
    },
    // Rotation finale
    finalRotation: {
      y: 0.5, // Angle en radians (Math.PI = 180°)
    },
  },
} as const;

/**
 * Presets pour différents modes
 */
export const HOUSE_3D_PRESETS = {
  // Mode par défaut (expérience complète)
  default: HOUSE_3D_CONFIG,

  // Mode performance (animations réduites)
  performance: {
    ...HOUSE_3D_CONFIG,
    float: {
      ...HOUSE_3D_CONFIG.float,
      enabled: false, // Désactive le Float
    },
    rotation: {
      ...HOUSE_3D_CONFIG.rotation,
      duration: 30, // Rotation plus lente
    },
  },

  // Mode mobile (optimisé)
  mobile: {
    ...HOUSE_3D_CONFIG,
    model: {
      ...HOUSE_3D_CONFIG.model,
      scale: 1.2, // Maison plus petite
    },
    float: {
      ...HOUSE_3D_CONFIG.float,
      enabled: false,
    },
    scrollTransition: {
      ...HOUSE_3D_CONFIG.scrollTransition,
      scrub: 2, // Moins fluide mais plus performant
    },
  },

  // Mode showcase (animations exagérées pour démo)
  showcase: {
    ...HOUSE_3D_CONFIG,
    model: {
      ...HOUSE_3D_CONFIG.model,
      scale: 2, // Maison plus grande
    },
    rotation: {
      ...HOUSE_3D_CONFIG.rotation,
      duration: 10, // Rotation rapide
    },
    float: {
      ...HOUSE_3D_CONFIG.float,
      speed: 3,
      floatIntensity: 1,
    },
  },
} as const;

/**
 * Helper pour obtenir la config en fonction du contexte
 */
export function getHouse3DConfig() {
  // En production, on peut détecter le device
  if (typeof window !== "undefined") {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return HOUSE_3D_PRESETS.mobile;
    }
  }

  return HOUSE_3D_PRESETS.default;
}
