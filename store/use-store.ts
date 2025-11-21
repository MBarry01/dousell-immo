"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Property } from "@/types/property";

type FavoritesState = {
  favorites: Property[];
  addFavorite: (property: Property) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (property) =>
        set((state) => {
          if (state.favorites.find((item) => item.id === property.id)) {
            return state;
          }
          return { favorites: [...state.favorites, property] };
        }),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((item) => item.id !== id),
        })),
      isFavorite: (id) => {
        return get().favorites.some((item) => item.id === id);
      },
    }),
    {
      name: "doussel-immo-favorites",
      version: 1,
    }
  )
);

