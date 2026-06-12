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
import { useAuth } from '@/hooks/useAuth';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AppContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // --- Bootstrap: fetch categories & wishlist on mount --------------------
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const promises = [categoryService.getAll()];
      if (isAuthenticated) {
        promises.push(wishlistService.getWishlist());
      }

      const results = await Promise.allSettled(promises);

      if (cancelled) return;

      const catResult = results[0];
      const wishResult = isAuthenticated ? results[1] : null;

      if (catResult.status === 'fulfilled') {
        setCategories(catResult.value.data ?? []);
      }

      if (isAuthenticated) {
        if (wishResult && wishResult.status === 'fulfilled') {
          const items = wishResult.value.data ?? [];
          setWishlistIds(new Set(items.map((item) => item.bookId)));
        }
      } else {
        setWishlistIds(new Set());
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

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
