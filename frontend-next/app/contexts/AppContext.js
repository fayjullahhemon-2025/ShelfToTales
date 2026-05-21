'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { categoryService, wishlistService } from '@/lib/api';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AppContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // --- Bootstrap: fetch categories & wishlist on mount --------------------
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const [catResult, wishResult] = await Promise.allSettled([
        categoryService.getAll(),
        wishlistService.getWishlist(),
      ]);

      if (cancelled) return;

      if (catResult.status === 'fulfilled') {
        setCategories(catResult.value.data ?? []);
      }

      if (wishResult.status === 'fulfilled') {
        const items = wishResult.value.data ?? [];
        setWishlistIds(new Set(items.map((item) => item.bookId)));
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  // --- Actions -----------------------------------------------------------

  const isWishlisted = useCallback(
    (bookId) => wishlistIds.has(bookId),
    [wishlistIds],
  );

  const toggleWishlist = useCallback(
    async (bookId) => {
      const currentlyWishlisted = wishlistIds.has(bookId);

      // Optimistic update
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (currentlyWishlisted) {
          next.delete(bookId);
        } else {
          next.add(bookId);
        }
        return next;
      });

      try {
        if (currentlyWishlisted) {
          await wishlistService.removeFromWishlist(bookId);
        } else {
          await wishlistService.addToWishlist(bookId);
        }
      } catch (err) {
        // Roll back optimistic update on failure
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (currentlyWishlisted) {
            next.add(bookId);
          } else {
            next.delete(bookId);
          }
          return next;
        });
        throw err;
      }
    },
    [wishlistIds],
  );

  // --- Value -------------------------------------------------------------

  const value = useMemo(
    () => ({
      categories,
      wishlistIds,
      isWishlisted,
      toggleWishlist,
    }),
    [categories, wishlistIds, isWishlisted, toggleWishlist],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
