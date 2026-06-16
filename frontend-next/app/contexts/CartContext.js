'use client';

import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { cartService } from '@/lib/api';
import { useAuthContext } from './AuthContext';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const ACTIONS = {
  SET_CART: 'SET_CART',
  SET_LOADING: 'SET_LOADING',
};

const initialState = {
  items: [],
  count: 0,
  total: 0,
  loading: false,
};

function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload.items ?? [],
        count: action.payload.count ?? action.payload.totalItems ?? 0,
        total: action.payload.total ?? action.payload.totalPrice ?? 0,
        loading: false,
      };
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated, loading: authLoading } = useAuthContext();

  // Auto-fetch cart when the user is authenticated
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    cartService
      .getCart()
      .then(({ data }) => dispatch({ type: ACTIONS.SET_CART, payload: data }))
      .catch(() => {});
  }, [isAuthenticated, authLoading]);

  /**
   * Shared helper — sets loading, calls the API function, dispatches the
   * result. If the API throws, loading is reset to false so the UI doesn't
   * stay stuck.
   */
  const withCartAction = useCallback(async (apiFn, ...args) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    try {
      const { data } = await apiFn(...args);
      dispatch({ type: ACTIONS.SET_CART, payload: data });
    } catch (err) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      throw err;
    }
  }, []);

  const refreshCart = useCallback(
    () => withCartAction(cartService.getCart),
    [withCartAction],
  );

  const addToCart = useCallback(
    (bookId, qty = 1) => withCartAction(cartService.addToCart, bookId, qty),
    [withCartAction],
  );

  const updateQuantity = useCallback(
    (bookId, qty) => withCartAction(cartService.updateQuantity, bookId, qty),
    [withCartAction],
  );

  const removeFromCart = useCallback(
    (bookId) => withCartAction(cartService.removeFromCart, bookId),
    [withCartAction],
  );

  // --- Value -------------------------------------------------------------

  const value = useMemo(
    () => ({
      ...state,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
    }),
    [state, refreshCart, addToCart, updateQuantity, removeFromCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
