'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReadingProgress } from '../useReadingProgress';
import { useAuthToken } from '../useAuthToken';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

/**
 * High-level state controller for a flipbook viewer. Owns the current page,
 * zoom level, spread vs single-page mode, and the registry of keyboard
 * shortcuts. Designed to be consumed once by `FlipbookViewer` and passed
 * down to the toolbar / navigator / canvas.
 *
 * @param {object} options
 * @param {object|null} options.flipbook Loaded flipbook payload.
 * @returns {{
 *   pageIndex: number,
 *   totalPages: number,
 *   goTo: (index: number) => void,
 *   next: () => void,
 *   prev: () => void,
 *   zoom: number,
 *   zoomIn: () => void,
 *   zoomOut: () => void,
 *   resetZoom: () => void,
 *   mode: 'single' | 'spread',
 *   toggleMode: () => void,
 *   muted: boolean,
 *   toggleMute: () => void,
 *   textMode: boolean,
 *   toggleTextMode: () => void,
 *   gridOpen: boolean,
 *   openGrid: () => void,
 *   closeGrid: () => void,
 *   searchOpen: boolean,
 *   openSearch: () => void,
 *   closeSearch: () => void,
 *   embedOpen: boolean,
 *   openEmbed: () => void,
 *   closeEmbed: () => void,
 *   actionsOpen: boolean,
 *   setActionsOpen: (open: boolean) => void,
 * }}
 */
export function useFlipbook({ flipbook, bookId = null } = {}) {
  const totalPages = flipbook?.pages?.length ?? 0;
  const [pageIndex, setPageIndex] = useState(0);
  const numericBookId = typeof bookId === 'number' || (typeof bookId === 'string' && /^\d+$/.test(bookId))
    ? Number(bookId)
    : null;
  const [token, setToken] = useAuthToken();

  const progress = useReadingProgress({ bookId: token ? numericBookId : null });

  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState('single');
  const [muted, setMuted] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  useEffect(() => {
    setPageIndex(0);
    setZoom(1);
  }, [flipbook?.id]);

  // Hydrate the page from the backend once the progress fetch lands.
  useEffect(() => {
    if (numericBookId == null || !token) return;
    if (!progress.loading && progress.currentPage > 0 && progress.currentPage < totalPages) {
      setPageIndex(progress.currentPage);
    }
  }, [numericBookId, token, progress.loading, progress.currentPage, totalPages]);

  // Persist the page whenever the user changes it (debounced inside the hook).
  useEffect(() => {
    if (numericBookId == null || !token) return;
    if (progress.loading) return;
    progress.savePage(pageIndex);
  }, [numericBookId, token, pageIndex, progress.loading, progress.savePage]);

  const goTo = useCallback((index) => {
    setPageIndex((current) => {
      if (totalPages === 0) return 0;
      const next = Math.max(0, Math.min(totalPages - 1, index));
      return next;
    });
  }, [totalPages]);

  const next = useCallback(() => goTo(pageIndex + 1), [goTo, pageIndex]);
  const prev = useCallback(() => goTo(pageIndex - 1), [goTo, pageIndex]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  const toggleMode = useCallback(() => setMode((m) => (m === 'single' ? 'spread' : 'single')), []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleTextMode = useCallback(() => setTextMode((t) => !t), []);

  const openGrid = useCallback(() => setGridOpen(true), []);
  const closeGrid = useCallback(() => setGridOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openEmbed = useCallback(() => setEmbedOpen(true), []);
  const closeEmbed = useCallback(() => setEmbedOpen(false), []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = (event) => {
      if (gridOpen || searchOpen || embedOpen) return;
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || event.target.isContentEditable) return;
      }
      if (event.key === 'ArrowRight') next();
      else if (event.key === 'ArrowLeft') prev();
      else if (event.key === '+' || event.key === '=') zoomIn();
      else if (event.key === '-' || event.key === '_') zoomOut();
      else if (event.key === '0') resetZoom();
      else if (event.key === 'g' || event.key === 'G') openGrid();
      else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (event.key === '/' ) {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, zoomIn, zoomOut, resetZoom, openGrid, openSearch, gridOpen, searchOpen, embedOpen]);

  return useMemo(() => ({
    pageIndex,
    totalPages,
    goTo,
    next,
    prev,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    mode,
    toggleMode,
    muted,
    toggleMute,
    textMode,
    toggleTextMode,
    gridOpen,
    openGrid,
    closeGrid,
    searchOpen,
    openSearch,
    closeSearch,
    embedOpen,
    openEmbed,
    closeEmbed,
    actionsOpen,
    setActionsOpen,
    progress,
  }), [
    pageIndex, totalPages, goTo, next, prev, zoom, zoomIn, zoomOut, resetZoom,
    mode, toggleMode, muted, toggleMute, textMode, toggleTextMode,
    gridOpen, openGrid, closeGrid, searchOpen, openSearch, closeSearch,
    embedOpen, openEmbed, closeEmbed, actionsOpen,
  ]);
}
