"use client";

import { create } from "zustand";
import { requestAccessAction } from "@/app/(workspace)/gestion/access-control/actions";

interface AccessModalState {
  isOpen: boolean;
  featureName: string;
  permissionKey: string;
  isSubmitting: boolean;
  reason: string;

  // Actions
  openRequestModal: (featureName: string, permissionKey: string) => void;
  close: () => void;
  setReason: (reason: string) => void;
  submitRequest: (teamId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAccessModal = create<AccessModalState>((set, get) => ({
  isOpen: false,
  featureName: "",
  permissionKey: "",
  isSubmitting: false,
  reason: "",

  openRequestModal: (featureName: string, permissionKey: string) => {
    set({
      isOpen: true,
      featureName,
      permissionKey,
      reason: "",
    });
  },

  close: () => {
    set({
      isOpen: false,
      featureName: "",
      permissionKey: "",
      reason: "",
      isSubmitting: false,
    });
  },

  setReason: (reason: string) => {
    set({ reason });
  },

  submitRequest: async (teamId: string) => {
    const { permissionKey, reason } = get();

    set({ isSubmitting: true });

    try {
      const result = await requestAccessAction({
        teamId,
        permission: permissionKey,
        reason: reason || undefined,
      });

      if (result.success) {
        get().close();
      }

      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
