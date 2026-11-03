"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import api, { setAccessToken, clearAccessToken } from "../../lib/api";
import { mapUserDto } from "../../lib/mappers/user.mapper";
import { useCurrentUser } from "../../hooks/useCurrentUser";

import { mapBeatDto } from "../../lib/mappers/beat.mapper";

export interface BeatItem {
  id: number | string;
  title: string;
  producer: string;
  artist?: string;
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
  role?: string;
  avatar?: string;
}

interface AppShellContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (idToken: string, nonce?: string) => Promise<void>;
  logout: () => Promise<void>;
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

const AppShellContext = createContext<AppShellContextValue | undefined>(
  undefined,
);

const CART_STORAGE_KEY = "prabhmusick-cart";
const WISHLIST_STORAGE_KEY = "prabhmusick-wishlist";
const PURCHASES_STORAGE_KEY = "prabhmusick-purchases";

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

function migrateStoredCart(items: any[]): BeatItem[] {
  if (!Array.isArray(items)) return [];
  const valid: BeatItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    try {
      const normalized = mapBeatDto(item);
      if (normalized.id !== undefined && normalized.id !== null) {
        valid.push(normalized);
      }
    } catch {
      // Silently discard completely corrupted non-beat items
    }
  }
  return valid;
}

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const user = currentUser || null;
  const [cart, setCart] = useState<BeatItem[]>([]);
  const [wishlist, setWishlist] = useState<BeatItem[]>(defaultWishlist);
  const [purchasedBeats, setPurchasedBeats] =
    useState<BeatItem[]>(defaultPurchases);
  const [cartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const syncCartAfterLogin = async (localCart: BeatItem[]) => {
    try {
      const serverResponse = await api.get("/cart");
      const serverCart = serverResponse.data.data || [];
      const combined = [...serverCart, ...localCart];
      const migrated = migrateStoredCart(combined);
      const merged = Array.from(
        new Map(
          migrated.map((item) => [String(item.id), item]),
        ).values(),
      );
      const response = await api.put("/cart", { items: merged });
      const finalCart = response.data.data || [];
      setCart(migrateStoredCart(finalCart));
    } catch (err) {
      console.error("Failed to sync cart after login", err);
    }
  };

  useEffect(() => {
    const rawCart = getStoredValue<any[]>(CART_STORAGE_KEY, []);
    setCart(migrateStoredCart(rawCart));
    setWishlist(
      getStoredValue<BeatItem[]>(WISHLIST_STORAGE_KEY, defaultWishlist),
    );
    setPurchasedBeats(
      getStoredValue<BeatItem[]>(PURCHASES_STORAGE_KEY, defaultPurchases),
    );
    setHydrated(true);
  }, []);

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

  // Event handler for background session expiration notifications
  useEffect(() => {
    const handleSessionExpired = () => {
      clearAccessToken();
      queryClient.setQueryData(["currentUser"], null);

      setCart([]);
      setWishlist([]);
      setPurchasedBeats([]);
      setCartOpen(false);
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, [queryClient]);

  const login = async (emailOrUsername: string, password: string) => {
    const response = await api.post("/auth/login", {
      email: emailOrUsername,
      password: password,
    });

    const { user: backendUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    const mapped = mapUserDto(backendUser);
    queryClient.setQueryData(["currentUser"], mapped);
    await syncCartAfterLogin(cart);
    setCartOpen(false);
  };

  const signup = async (fullName: string, email: string, password: string) => {
    const response = await api.post("/auth/signup", {
      name: fullName,
      email,
      password,
    });

    const { user: backendUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    const mapped = mapUserDto(backendUser);
    queryClient.setQueryData(["currentUser"], mapped);

    // Reset user-specific lists for new accounts
    setCart([]);
    setWishlist([]);
    setPurchasedBeats([]);
    setCartOpen(false);
  };

  const loginWithGoogle = async (idToken: string) => {
    const response = await api.post("/auth/google", { idToken });

    const { user: backendUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    const mapped = mapUserDto(backendUser);
    queryClient.setQueryData(["currentUser"], mapped);
    await syncCartAfterLogin(cart);
    setCartOpen(false);
  };

  const loginWithApple = async (idToken: string, nonce?: string) => {
    const response = await api.post("/auth/apple", { idToken, nonce });

    const { user: backendUser, accessToken } = response.data.data;
    setAccessToken(accessToken);
    const mapped = mapUserDto(backendUser);
    queryClient.setQueryData(["currentUser"], mapped);
    await syncCartAfterLogin(cart);
    setCartOpen(false);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // Ignore network errors to guarantee UI teardown proceeds
    } finally {
      clearAccessToken();
      queryClient.setQueryData(["currentUser"], null);

      setCart([]);
      setWishlist([]);
      setPurchasedBeats([]);
      setCartOpen(false);
    }
  };

  const addToCart = (beat: BeatItem) => {
    if (!beat) return;
    const canonicalBeat = mapBeatDto(beat);
    setCart((current) => {
      if (current.some((item) => String(item.id) === String(canonicalBeat.id))) {
        return current;
      }
      const next = [...current, canonicalBeat];
      if (user) {
        api.put("/cart", { items: next }).catch((error) => {
          console.error("Failed to persist cart", error);
        });
      }
      return next;
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: number | string) => {
    setCart((current) => {
      const next = current.filter((item) => String(item.id) !== String(id));
      if (user) {
        api.put("/cart", { items: next }).catch((error) => {
          console.error("Failed to persist cart", error);
        });
      }
      return next;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (user) {
      api.put("/cart", { items: [] }).catch((error) => {
        console.error("Failed to persist cart", error);
      });
    }
  };

  const checkoutCart = () => {
    if (!cart.length) return;
    setPurchasedBeats((prev) => [...prev, ...cart]);
    setCart([]);
    setCartOpen(false);
  };

  const toggleWishlist = (beat: BeatItem) => {
    if (!beat) return;
    const canonicalBeat = mapBeatDto(beat);
    setWishlist((current) => {
      const exists = current.some((item) => String(item.id) === String(canonicalBeat.id));
      return exists
        ? current.filter((item) => String(item.id) !== String(canonicalBeat.id))
        : [...current, canonicalBeat];
    });
  };

  const value = useMemo<AppShellContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      signup,
      loginWithGoogle,
      loginWithApple,
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
    [user, cart, wishlist, purchasedBeats, cartOpen],
  );

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error("useAppShell must be used within an AppShellProvider");
  }
  return context;
}
