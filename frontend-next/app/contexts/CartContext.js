'use client';

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { cartService } from '@/lib/api';

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
        count: action.payload.count ?? 0,
        total: action.payload.total ?? 0,
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

  const refreshCart = useCallback(async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    const { data } = await cartService.getCart();
    dispatch({ type: ACTIONS.SET_CART, payload: data });
  }, []);

  const addToCart = useCallback(async (bookId, qty = 1) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    const { data } = await cartService.addToCart(bookId, qty);
    dispatch({ type: ACTIONS.SET_CART, payload: data });
  }, []);

  const updateQuantity = useCallback(async (bookId, qty) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    const { data } = await cartService.updateQuantity(bookId, qty);
    dispatch({ type: ACTIONS.SET_CART, payload: data });
  }, []);

  const removeFromCart = useCallback(async (bookId) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    const { data } = await cartService.removeFromCart(bookId);
    dispatch({ type: ACTIONS.SET_CART, payload: data });
  }, []);

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
