'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';

/**
 * Memoized book card for grid views. Ported from CRA's BookGridCard.
 *
 * Differences from the CRA version:
 *  - <Link> is from next/link (uses `href`, not `to`)
 *  - <img> tag is plain HTML (we can swap to next/image later for free
 *    optimization once we audit the cover URL sources)
 */
function BookGridCardImpl({
  book,
  onAddToWishlist,
  onAddToCart,
  onQuickView,
  categoryAsLink = false,
  categoryHrefBuilder,
  showAuthor = false,
  fallbackCover,
  wishlistInputIdPrefix = 'wish',
}) {
  const handleWishlistChange = useCallback(() => {
    onAddToWishlist?.(book.id);
  }, [book.id, onAddToWishlist]);

  const handleCartClick = useCallback(() => {
    onAddToCart?.(book.id);
  }, [book.id, onAddToCart]);

  const coverSrc = book.coverUrl || book.imageUrl || fallbackCover || '';
  const wishId = `${wishlistInputIdPrefix}-${book.id}`;

  const categoryLabel = book.categoryName || book.category?.name || 'General';
  const categoryNode =
    categoryAsLink && categoryHrefBuilder ? (
      <Link href={categoryHrefBuilder(book)}>{categoryLabel}</Link>
    ) : (
      categoryLabel
    );

  return (
    <div className="dz-shop-card style-1">
      <div className="dz-media">
        <img
          src={coverSrc}
          alt={book.title || 'book cover'}
          loading="lazy"
          decoding="async"
          width="250"
          height="350"
        />
      </div>
      <div className="bookmark-btn style-2">
        <input
          className="form-check-input"
          type="checkbox"
          id={wishId}
          onChange={handleWishlistChange}
        />
        <label className="form-check-label" htmlFor={wishId}>
          <i className="flaticon-heart" />
        </label>
      </div>
      <div className="dz-content">
        <h5 className="title">
          <Link href={`/shop-detail/${book.id}`}>{book.title}</Link>
        </h5>
        <ul className="dz-tags">
          <li>{categoryNode}</li>
        </ul>
        {showAuthor && book.author && (
          <div className="book-author" style={{ fontSize: '0.85rem', color: '#888' }}>
            by {book.author}
          </div>
        )}
        <ul className="dz-rating">
          {[1, 2, 3, 4, 5].map((i) => (
            <li key={i}>
              <i className="flaticon-star text-yellow" />
            </li>
          ))}
        </ul>
        <div className="book-footer">
          <div className="price">
            <span className="price-num">${book.discountPrice || book.price || '9.99'}</span>
            {book.discountPrice && <del>${book.price}</del>}
          </div>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(book)}
              className="btn btn-outline-secondary box-btn btnhover btnhover2 me-2"
            >
              Quick View
            </button>
          )}
          <button
            type="button"
            onClick={handleCartClick}
            className="btn btn-secondary box-btn btnhover btnhover2"
          >
            <i className="flaticon-shopping-cart-1 m-r10" /> Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

const BookGridCard = memo(BookGridCardImpl);
BookGridCard.displayName = 'BookGridCard';

export default BookGridCard;
