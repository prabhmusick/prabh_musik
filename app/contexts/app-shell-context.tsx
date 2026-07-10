"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface BeatItem {
  id: number | string;
  title: string;
  producer: string;
  price: number | null;
  cover: string;
  genre?: string;
  bpm?: number;
  previewUrl?: string;
  plays?: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AppShellContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (payload: Partial<UserProfile> & { emailOrUsername?: string }) => void;
  signup: (payload: Partial<UserProfile> & { email?: string; fullName?: string; username?: string }) => void;
  logout: () => void;
  cart: BeatItem[];
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (beat: BeatItem) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  checkoutCart: () => void;
  purchasedBeats: BeatItem[];
  wishlist: BeatItem[];
  toggleWishlist: (beat: BeatItem) => void;
}

const AppShellContext = createContext<AppShellContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "prabhmusick-user";
const CART_STORAGE_KEY = "prabhmusick-cart";
const WISHLIST_STORAGE_KEY = "prabhmusick-wishlist";
const PURCHASES_STORAGE_KEY = "prabhmusick-purchases";

// Empty defaults - user data should come from backend, not hardcoded mocks
const defaultPurchases: BeatItem[] = [];
const defaultWishlist: BeatItem[] = [];

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persistValue<T>(key: string, value: T | null) {
  if (typeof window === "undefined") return;
  if (value === null) {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<BeatItem[]>([]);
  const [wishlist, setWishlist] = useState<BeatItem[]>(defaultWishlist);
  const [purchasedBeats, setPurchasedBeats] = useState<BeatItem[]>(defaultPurchases);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getStoredValue<UserProfile | null>(USER_STORAGE_KEY, null));
    setCart(getStoredValue<BeatItem[]>(CART_STORAGE_KEY, []));
    setWishlist(getStoredValue<BeatItem[]>(WISHLIST_STORAGE_KEY, defaultWishlist));
    setPurchasedBeats(getStoredValue<BeatItem[]>(PURCHASES_STORAGE_KEY, defaultPurchases));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistValue(USER_STORAGE_KEY, user);
  }, [hydrated, user]);

  useEffect(() => {
    if (!hydrated) return;
    persistValue(CART_STORAGE_KEY, cart);
  }, [hydrated, cart]);

  useEffect(() => {
    if (!hydrated) return;
    persistValue(WISHLIST_STORAGE_KEY, wishlist);
  }, [hydrated, wishlist]);

  useEffect(() => {
    if (!hydrated) return;
    persistValue(PURCHASES_STORAGE_KEY, purchasedBeats);
  }, [hydrated, purchasedBeats]);

  const login = (payload: Partial<UserProfile> & { emailOrUsername?: string }) => {
    const fallbackName = payload.fullName || payload.username || payload.emailOrUsername?.split("@")[0] || "Producer";
    setUser({
      id: payload.id || `${Date.now()}`,
      fullName: fallbackName,
      username: payload.username || fallbackName.toLowerCase().replace(/\s+/g, "_"),
      email: payload.email || payload.emailOrUsername || "producer@prabhmusik.com",
      avatar: payload.avatar || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(fallbackName)}`,
    });
    setCartOpen(false);
  };

  const signup = (payload: Partial<UserProfile> & { email?: string; fullName?: string; username?: string }) => {
    setUser({
      id: payload.id || `${Date.now()}`,
      fullName: payload.fullName || "New Creator",
      username: payload.username || "new_creator",
      email: payload.email || "creator@prabhmusik.com",
      avatar: payload.avatar || "https://api.dicebear.com/7.x/thumbs/svg?seed=creator",
    });
    // Clear user-specific data for new signup
    setCart([]);
    setWishlist([]);
    setPurchasedBeats([]);
    setCartOpen(false);
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    setWishlist([]);
    setPurchasedBeats([]);
    setCartOpen(false);
  };

  const addToCart = (beat: BeatItem) => {
    setCart((current) => {
      if (current.some((item) => item.id === beat.id)) {
        return current;
      }
      return [...current, beat];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: number | string) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const checkoutCart = () => {
    if (!cart.length) return;
    setPurchasedBeats((prev) => [...prev, ...cart]);
    setCart([]);
    setCartOpen(false);
  };

  const toggleWishlist = (beat: BeatItem) => {
    setWishlist((current) => {
      const exists = current.some((item) => item.id === beat.id);
      return exists ? current.filter((item) => item.id !== beat.id) : [...current, beat];
    });
  };

  const value = useMemo<AppShellContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      cart,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      addToCart,
      removeFromCart,
      clearCart,
      checkoutCart,
      purchasedBeats,
      wishlist,
      toggleWishlist,
    }),
    [user, cart, wishlist, purchasedBeats, cartOpen]
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }
  return context;
}
