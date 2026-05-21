'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authService, userService } from '@/lib/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY_TOKEN = 'token';
const STORAGE_KEY_USER = 'user';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  SET_LOADING: 'SET_LOADING',
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // true until the init effect completes
};

function authReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      };
    case ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: action.payload,
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

const AuthContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // --- Hydrate from localStorage on mount -------------------------------
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        dispatch({
          type: ACTIONS.LOGIN_SUCCESS,
          payload: { token: storedToken, user },
        });
      } else {
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    } catch {
      // Corrupted localStorage -- start clean.
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  }, []);

  // --- Actions -----------------------------------------------------------

  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    const token = data.token ?? data.accessToken;
    localStorage.setItem(STORAGE_KEY_TOKEN, token);

    const profileRes = await userService.getProfile();
    const user = profileRes.data;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

    dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: { token, user } });
    return user;
  }, []);

  const googleAuth = useCallback(async (idToken) => {
    const { data } = await authService.googleAuth(idToken);
    const token = data.token ?? data.accessToken;
    localStorage.setItem(STORAGE_KEY_TOKEN, token);

    const profileRes = await userService.getProfile();
    const user = profileRes.data;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

    dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: { token, user } });
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    dispatch({ type: ACTIONS.LOGOUT });
  }, []);

  const updateProfile = useCallback((data) => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data));
    dispatch({ type: ACTIONS.UPDATE_PROFILE, payload: data });
  }, []);

  // --- Value -------------------------------------------------------------

  const value = {
    ...state,
    login,
    googleAuth,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
