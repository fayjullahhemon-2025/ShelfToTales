'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { getMockFlipbook } from '@/data/mockFlipbook';
import { useFlipbook } from '@/hooks/flipbook/useFlipbook';
import { useFullscreen } from '@/hooks/flipbook/useFullscreen';
import { bookService } from '@/lib/api';
import FlipbookCanvas from './FlipbookCanvas';
import FlipbookToolbar from './FlipbookToolbar';
import PageNavigator from './PageNavigator';
import ThumbnailGrid from './ThumbnailGrid';
import FlipbookActions from './FlipbookActions';
import SearchModal from './SearchModal';
import EmbedModal from './EmbedModal';

/**
 * Top-level orchestrator. Loads the flipbook payload (currently the mock
 * catalog), wires the toolbar/canvas/modals together, and exposes the
 * `flipbookId` prop as the only contract callers need.
 *
 * @param {object} props
 * @param {string} props.flipbookId Identifier resolved by the route.
 * @returns {JSX.Element}
 */
export default function FlipbookViewer({ flipbookId }) {
  const containerRef = useRef(null);
  const fullscreen = useFullscreen(containerRef);

  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isNumeric = typeof flipbookId === 'number' || (typeof flipbookId === 'string' && /^\d+$/.test(flipbookId));

  useEffect(() => {
    if (!isNumeric) {
      setLoading(false);
      return;
    }
    setLoading(true);
    bookService.getById(flipbookId)
      .then((res) => {
        setBookData(res.data);
      })
      .catch((err) => {
        console.error('Failed to fetch book details for flipbook', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [flipbookId, isNumeric]);

  const flipbook = useMemo(() => {
    if (isNumeric) {
      if (!bookData) return null;
      const total = 10;
      const pages = Array.from({ length: total }, (_, i) => {
        const isCover = i === 0;
        const isBack = i === total - 1;
        let image = bookData.coverUrl || 'https://picsum.photos/seed/fb-cover/1200/800';
        if (i > 0 && i < total - 1) {
          image = `https://picsum.photos/seed/fb-page-${bookData.id}-${i}/1200/800`;
        }
        let text = `Chapter ${i}: Reading preview of "${bookData.title}".\n\n`;
        if (isCover) {
          text = `${bookData.title}\nBy ${bookData.author}\n\n${bookData.description || ''}`;
        } else if (isBack) {
          text = `Thank you for reading the preview of "${bookData.title}".\n\nISBN: ${bookData.isbn || 'N/A'}\nPublished: ${bookData.publishedDate || 'N/A'}\nCategory: ${bookData.categoryName || 'N/A'}`;
        } else {
          const paragraphs = (bookData.description || 'Welcome to the preview of this book. ShelfToTales communities offer reviews, ratings, recommendations and more. Join us for the full experience.').split('\n');
          const pContent = paragraphs[i % paragraphs.length] || `This is a preview page of "${bookData.title}". Please purchase the book to read the complete version.`;
          text += pContent;
        }

        return {
          id: `page-${bookData.id}-${i}`,
          index: i,
          image,
          width: 1200,
          height: 800,
          title: isCover ? 'Cover' : isBack ? 'End' : `Page ${i + 1}`,
          text,
        };
      });

      return {
        id: String(bookData.id),
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        cover: bookData.coverUrl,
        pages,
        createdAt: bookData.publishedDate || '2026-01-01',
      };
    } else {
      return getMockFlipbook(flipbookId);
    }
  }, [isNumeric, bookData, flipbookId]);

  const state = useFlipbook({ flipbook, bookId: isNumeric ? Number(flipbookId) : null });

  if (isNumeric && loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Loading flipbook...</p>
      </div>
    );
  }

  if (!flipbook) {
    return (
      <div className="text-center py-5">
        <i className="fa-solid fa-book-open fa-3x text-muted mb-3" aria-hidden="true" />
        <h1 className="h4">Flipbook not found</h1>
        <p className="text-muted">We could not locate a book with that id.</p>
      </div>
    );
  }

  const currentPage = flipbook.pages[state.pageIndex];

  return (
    <section
      ref={containerRef}
      className="fb-viewer d-flex flex-column bg-white border rounded shadow-sm overflow-hidden"
      aria-label={`${flipbook.title} flipbook`}
    >
      {state.textMode ? (
        <article
          className="p-4"
          style={{ maxHeight: 'min(70vh, 720px)', overflowY: 'auto' }}
          aria-label={`${flipbook.title} text version`}
        >
          <h2 className="h4">{currentPage?.title}</h2>
          <p className="lead">{currentPage?.text}</p>
          <p className="small text-muted">
            Page {state.pageIndex + 1} of {state.totalPages}
          </p>
        </article>
      ) : (
        <FlipbookCanvas
          flipbook={flipbook}
          pageIndex={state.pageIndex}
          onFlip={(direction) => {
            if (direction > 0) state.next();
            else state.prev();
          }}
        />
      )}

      <div className="d-flex align-items-center justify-content-center p-2 bg-light border-top">
        <PageNavigator
          pageIndex={state.pageIndex}
          totalPages={state.totalPages}
          onGoTo={state.goTo}
          onPrev={state.prev}
          onNext={state.next}
        />
      </div>

      <FlipbookToolbar
        onOpenGrid={state.openGrid}
        onZoomOut={state.zoomOut}
        onZoomIn={state.zoomIn}
        onResetZoom={state.resetZoom}
        zoom={state.zoom}
        muted={state.muted}
        onToggleMute={state.toggleMute}
        onOpenSearch={state.openSearch}
        onToggleFullscreen={fullscreen.toggle}
        onToggleTextMode={state.toggleTextMode}
        onOpenEmbed={state.openEmbed}
        onShare={() => {
          if (typeof window !== 'undefined' && typeof navigator.share === 'function') {
            navigator.share({
              title: flipbook.title,
              url: window.location.href,
            }).catch(() => {});
          }
        }}
        textMode={state.textMode}
      />

      <FlipbookActions
        flipbook={flipbook}
        textMode={state.textMode}
        onToggleTextMode={state.toggleTextMode}
        onOpenEmbed={state.openEmbed}
      />

      <ThumbnailGrid
        show={state.gridOpen}
        onHide={state.closeGrid}
        flipbook={flipbook}
        currentIndex={state.pageIndex}
        onJumpToPage={state.goTo}
      />
      <SearchModal
        show={state.searchOpen}
        onHide={state.closeSearch}
        flipbook={flipbook}
        onJumpToPage={state.goTo}
      />
      <EmbedModal
        show={state.embedOpen}
        onHide={state.closeEmbed}
        flipbook={flipbook}
      />
    </section>
  );
}
