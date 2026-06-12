'use client';

import { useAppContext } from '../contexts/AppContext';

/**
 * Thin wrapper around AppContext's wishlist slice. Keeps component imports
 * clean and decouples them from the context implementation.
 */
export function useWishlist() {
  const { isWishlisted, toggleWishlist, wishlistIds } = useAppContext();

  return { isWishlisted, toggleWishlist, wishlistCount: wishlistIds?.size || 0 };
}
