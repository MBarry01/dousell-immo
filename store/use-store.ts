"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Property } from "@/types/property";

// Limits for localStorage favorites (before server sync)
const MAX_LOCAL_FAVORITES = 10;

type FavoritesState = {
  favorites: Property[];
  /** Add a property to favorites (respects local limit) */
  addFavorite: (property: Property) => boolean;
  /** Remove a property from favorites */
  removeFavorite: (id: string) => void;
  /** Check if property is in favorites */
  isFavorite: (id: string) => boolean;
  /** Clear all favorites (used after sync or logout) */
  clearFavorites: () => void;
  /** Get count of favorites */
  getCount: () => number;
  /** Check if at local limit */
  isAtLimit: () => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (property) => {
        const state = get();

        // Check if already favorited
        if (state.favorites.find((item) => item.id === property.id)) {
          return false;
        }

        // Check local limit (for anonymous users)
        if (state.favorites.length >= MAX_LOCAL_FAVORITES) {
          return false;
        }

        set({ favorites: [...state.favorites, property] });
        return true;
      },

      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((item) => item.id !== id),
        })),

      isFavorite: (id) => {
        return get().favorites.some((item) => item.id === id);
      },

      clearFavorites: () => set({ favorites: [] }),

      getCount: () => get().favorites.length,

      isAtLimit: () => get().favorites.length >= MAX_LOCAL_FAVORITES,
    }),
    {
      name: "dousell-immo-favorites",
      version: 2, // Bump version for migration
    }
  )
);

