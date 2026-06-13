'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav, Tab } from 'react-bootstrap';
import { bookService, wishlistService, reviewService, reviewCommentService } from '../../lib/api';
import { useCart } from '../../hooks/useCart';
import Swal from 'sweetalert2';
import { FadeIn } from '../../components/common/AnimationUtils';

//Component
import NewsLetter from '../../components/features/NewsLetter';
import ReportButton from '../../components/features/ReportButton';
import ReviewCard from '../../components/features/Review/ReviewCard';

//Images
const profile2 = '/assets/images/profile2.jpg';

function ReviewCommentsThread({ reviewId }) {
    const [comments, setComments] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [token, setToken] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setToken(localStorage.getItem('token'));
            setIsAdmin(localStorage.getItem('role') === 'ADMIN');
            const profile = localStorage.getItem('profile');
            if (profile) {
                try {
                    const parsed = JSON.parse(profile);
                    setCurrentUserId(parsed.id);
                } catch (e) {}
            }
        }
    }, []);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await reviewCommentService.getByReviewId(reviewId);
            setComments(res.data || []);
        } catch (e) {
            console.error('Failed to load review comments', e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleExpand = () => {
        if (!expanded) {
            fetchComments();
        }
        setExpanded(!expanded);
    };

    const handlePostComment = async (e, parentId) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSubmitting(true);
        try {
            await reviewCommentService.create(reviewId, {
                parentCommentId: parentId,
                content: replyContent.trim()
            });
            setReplyContent('');
            setReplyingToId(null);
            await fetchComments();
            Swal.fire({ icon: 'success', title: 'Reply posted', timer: 1000, showConfirmButton: false });
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to post reply', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirm = await Swal.fire({
            title: 'Delete Reply?',
            text: 'Are you sure you want to remove this reply?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Delete',
            confirmButtonColor: '#ef4444'
        });
        if (!confirm.isConfirmed) return;
        try {
            await reviewCommentService.delete(commentId);
            await fetchComments();
            Swal.fire({ icon: 'success', title: 'Deleted', timer: 1000, showConfirmButton: false });
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Failed to delete reply', 'error');
        }
    };

    const renderNode = (node, depth = 0) => {
        const isAuthor = currentUserId === node.user?.id;
        const isReplying = replyingToId === node.id;

        return (
            <div key={node.id} style={{ marginLeft: depth > 0 ? '1.5rem' : '0', borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none', paddingLeft: depth > 0 ? '1rem' : '0', marginTop: '0.75rem' }}>
                <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-center gap-2">
                        <img 
                            src={node.user?.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(node.user?.username || 'U')}&size=24&background=eaa451&color=fff`} 
                            alt="" 
                            style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} 
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.user?.username || 'U')}&size=24&background=eaa451&color=fff`; }}
                        />
                        <strong style={{ fontSize: '0.85rem' }}>{node.user?.username || 'User'}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
                            {new Date(node.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <div className="d-flex gap-2">
                        {token && (
                            <button 
                                type="button" 
                                className="btn btn-link p-0 text-decoration-none small text-muted" 
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => { setReplyingToId(isReplying ? null : node.id); setReplyContent(''); }}
                            >
                                Reply
                            </button>
                        )}
                        {(isAuthor || isAdmin) && (
                            <button 
                                type="button" 
                                className="btn btn-link p-0 text-decoration-none small text-danger" 
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleDeleteComment(node.id)}
                            >
                                Delete
                            </button>
                        )}
                        <ReportButton targetType="REVIEW_COMMENT" targetId={node.id} className="btn btn-link p-0 text-decoration-none small text-muted" />
                    </div>
                </div>
                <p style={{ fontSize: '0.875rem', margin: '0.25rem 0 0.5rem 2rem', color: '#374151' }}>{node.content}</p>

                {isReplying && (
                    <form onSubmit={(e) => handlePostComment(e, node.id)} style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
                        <textarea
                            id={`comment-${node.id}-textarea`}
                            className="form-control form-control-sm mb-2"
                            placeholder="Write a reply…"
                            rows="2"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            required
                            autoComplete="off"
                            style={{ fontSize: '0.825rem', outline: 'none' }}
                        />
                        <div className="d-flex gap-2 justify-content-end">
                            <button type="button" className="btn btn-light btn-sm" onClick={() => setReplyingToId(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                {submitting ? 'Loading…' : 'Submit'}
                            </button>
                        </div>
                    </form>
                )}

                {node.replies && node.replies.map(reply => renderNode(reply, depth + 1))}
            </div>
        );
    };

    return (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.5rem' }}>
            <button 
                type="button" 
                className="btn btn-link p-0 text-decoration-none text-muted small" 
                style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={handleToggleExpand}
            >
                <i className={`fa-solid ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
                <span>{expanded ? 'Hide Replies' : 'Show / Write Replies'}</span>
            </button>

            {expanded && (
                <div style={{ paddingLeft: '1rem', marginTop: '0.5rem' }}>
                    {loading ? (
                        <div className="text-center py-2" style={{ fontSize: '0.8rem', color: '#6b7280' }}>Loading replies…</div>
                    ) : (
                        <>
                            {comments.map(node => renderNode(node, 0))}
                            {token && replyingToId === null && (
                                <form onSubmit={(e) => handlePostComment(e, null)} style={{ marginTop: '1rem' }}>
                                    <textarea
                                        id={`review-${reviewId}-reply-textarea`}
                                        className="form-control form-control-sm mb-2"
                                        placeholder="Write a reply to this review…"
                                        rows="2"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        required
                                        autoComplete="off"
                                        style={{ fontSize: '0.825rem', outline: 'none' }}
                                    />
                                    <div className="d-flex justify-content-end">
                                        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                            {submitting ? 'Loading…' : 'Post Reply'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}


function ShopDetail(){
    const { id } = useParams();
    const { addToCart } = useCart();
    const [book, setBook] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [count, setCount] = useState(1);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [hideSpoilers, setHideSpoilers] = useState(false);
    const [similarBooks, setSimilarBooks] = useState([]);

    const fetchReviews = async () => {
        try {
            const reviewsRes = await reviewService.getByBookId(id);
            setReviews(reviewsRes.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bookRes = await bookService.getById(id);
                setBook(bookRes.data);
                await fetchReviews();
                try {
                    const similarRes = await bookService.getSimilar(id);
                    setSimilarBooks(similarRes.data);
                } catch (err) {
                    console.error('Failed to load similar books:', err);
                }
            } catch (error) {
                console.error('Error fetching book data:', error);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAddToWishlist = async () => {
        try {
            await wishlistService.addToWishlist(id);
            Swal.fire({ icon: 'success', title: 'Added to wishlist', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            Swal.fire('Error', error.response?.status === 401 ? 'Please login to add to wishlist' : (error.response?.data?.message || 'Failed to add to wishlist'), 'error');
        }
    };

    const handleAddToCart = async () => {
        try {
            await addToCart(id, count);
            Swal.fire({ icon: 'success', title: 'Added to cart', showConfirmButton: false, timer: 1500, toast: true, position: 'top-end' });
        } catch (error) {
            if (error.response?.status === 401) {
                Swal.fire('Error', 'Please login to add to cart', 'error');
            } else {
                Swal.fire('Error', error.response?.data?.message || 'Failed to add to cart', 'error');
            }
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            await reviewService.addReview(id, {
                rating: parseInt(rating),
                comment,
                isSpoiler: false
            });
            Swal.fire('Success', 'Review submitted successfully!', 'success');
            setComment('');
            await fetchReviews();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to submit review';
            Swal.fire('Error', errorMsg, 'error');
        }
    };

    if (!book) return <div>Loading...</div>;

    const tableDetail = [
        {tablehead:'Book Title', tabledata: book.title},
        {tablehead:'Author', tabledata: book.author},
        {tablehead:'Category', tabledata: book.category?.name},
        {tablehead:'Stock', tabledata: book.stock},
    ];

    return(
        <>
            <div className="page-content bg-grey">
                <section className="content-inner-1">
                    <div className="container">
                        <FadeIn>
                        <div className="row book-grid-row style-4 m-b60">
                            <div className="col">
                                <div className="dz-box">
                                    <div className="dz-media">
                                        <img loading="lazy" decoding="async" src={book.coverUrl || '/images/book-default.jpg'} alt={book.title || 'Book cover'} style={{maxWidth: '300px'}} onError={(e) => { e.target.src = '/images/book-default.jpg'; }} />
                                    </div>
                                    <div className="dz-content">
                                        <div className="dz-header">
                                            <h3 className="title">{book.title}</h3>
                                            {(() => {
                                                const totalReviews = reviews.length;
                                                const avgRating = totalReviews > 0 
                                                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
                                                    : '0.0';
                                                return (
                                                    <div className="shop-item-rating">
                                                        <div className="d-lg-flex d-sm-inline-flex d-flex align-items-center">
                                                            <ul className="dz-rating">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <li key={i} className="pe-1">
                                                                        <i className={`flaticon-star ${i < Math.round(parseFloat(avgRating)) ? 'text-yellow' : 'text-muted'}`}></i>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            <h6 className="m-b0">{avgRating} ({totalReviews} reviews)</h6>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="dz-body">
                                            <div className="book-detail">
                                                <ul className="book-info">
                                                    <li>
                                                        <div className="writer-info">
                                                            <img loading="lazy" decoding="async" src={profile2} alt="book" />
                                                            <div>
                                                                <span>Writen by</span>{book.author}
                                                            </div>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                            <p className="text-1">{book.description}</p>
                                            <div className="book-footer">
                                                <div className="price">
                                                    <h5>${book.discountPrice || book.price}</h5>
                                                    {book.discountPrice && <p className="p-lr10">${book.price}</p>}
                                                </div>
                                                <div className="product-num">
                                                    <div className="quantity btn-quantity style-1 me-3">
                                                            <button className="btn btn-plus" type="button"                                                                 
                                                                onClick={() => setCount(count + 1)}
                                                            >
                                                                <i className="ti-plus"></i>
                                                            </button>
                                                            <input className="quantity-input" type="text" value={count} name="demo_vertical2" readOnly />
                                                            <button className="btn btn-minus " type="button"                                                             
                                                                onClick={() => setCount(Math.max(1, count - 1))}
                                                            >
                                                                <i className="ti-minus"></i>
                                                            </button> 
                                                        </div>
                                                                                    <button onClick={handleAddToWishlist} className="btn btn-primary btnhover btnhover2"><i className="flaticon-heart"></i> <span>Add to wishlist</span></button>
                                                    <button onClick={handleAddToCart} className="btn btn-primary btnhover btnhover2 ms-2"><i className="flaticon-shopping-cart-1"></i> <span>Add to cart</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </FadeIn>
                        <FadeIn delay={0.2}>
                        <div className="row">
                            <div className="col-xl-8">
                                <Tab.Container defaultActiveKey="details">
                                    <div className="product-description tabs-site-button">
                                        <Nav as="ul" className="nav nav-tabs">
                                            <Nav.Item as="li"><Nav.Link  eventKey="details">Details Product</Nav.Link></Nav.Item>
                                            <Nav.Item as="li"><Nav.Link  eventKey="review">Customer Reviews</Nav.Link></Nav.Item>
                                        </Nav>
                                        <Tab.Content>
                                            <Tab.Pane eventKey="details">
                                                <table className="table border book-overview">
                                                    <tbody>
                                                        {tableDetail.map((data, index)=>(
                                                            <tr key={index}>
                                                                <th>{data.tablehead}</th>
                                                                <td>{data.tabledata}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </Tab.Pane>
                                            <Tab.Pane eventKey="review">
                                                <div className="clear" id="comment-list">
                                                    <div className="post-comments comments-area style-1 clearfix">
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <h4 className="comments-title mb-0">{reviews.length} COMMENTS</h4>
                                                            {reviews.some(r => r.isSpoiler) && (
                                                                <label className="form-check d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
                                                                    <input type="checkbox" className="form-check-input" checked={hideSpoilers} onChange={() => setHideSpoilers(!hideSpoilers)}/>
                                                                    <span className="small text-muted">Hide spoiler reviews ({reviews.filter(r => r.isSpoiler).length})</span>
                                                                </label>
                                                            )}
                                                        </div>
                                                        <div id="comment">
                                                            <ol className="comment-list">
                                                                {reviews.filter(r => !hideSpoilers || !r.isSpoiler).map((rev, index) => (
                                                                    <li key={index} className="comment even thread-even depth-1">
                                                                        <ReviewCard id={rev.id} title={rev.user?.username || 'User'} comment={rev.comment} date={rev.createdAt} rating={rev.rating} avatar={rev.user?.profileImageUrl} isSpoiler={rev.isSpoiler} />
                                                                    </li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                        <div className="default-form comment-respond style-1" id="respond">
                                                            <h4 className="comment-reply-title" id="reply-title">LEAVE A REPLY</h4>
                                                            <div className="clearfix">
                                                                <form onSubmit={handleReviewSubmit} className="comment-form">
                                                                    <p className="comment-form-comment">
                                                                        <select className="form-control mb-2" value={rating} onChange={(e) => setRating(e.target.value)}>
                                                                            <option value="5">5 Stars</option>
                                                                            <option value="4">4 Stars</option>
                                                                            <option value="3">3 Stars</option>
                                                                            <option value="2">2 Stars</option>
                                                                            <option value="1">1 Star</option>
                                                                        </select>
                                                                        <textarea placeholder="Type Comment Here" className="form-control" value={comment} onChange={(e) => setComment(e.target.value)} required></textarea>
                                                                    </p>
                                                                    <p className="col-md-12 col-sm-12 col-xs-12 form-submit">
                                                                        <button type="submit" className="submit btn btn-primary filled">
                                                                        Submit Now <i className="fa fa-angle-right m-l10"></i>
                                                                        </button>
                                                                    </p>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                            </Tab.Pane>
                                        </Tab.Content>
                                    </div>
                                </Tab.Container>   
                            </div>

                            <div className="col-xl-4 col-lg-4">
                                <div className="widget style-1" style={{ 
                                    backgroundColor: '#fff', 
                                    padding: '25px', 
                                    borderRadius: '12px', 
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                    marginBottom: '30px'
                                }}>
                                    <h4 className="widget-title" style={{ 
                                        fontSize: '18px', 
                                        fontWeight: '700', 
                                        borderBottom: '2px solid #f0f0f0', 
                                        paddingBottom: '10px',
                                        marginBottom: '20px'
                                    }}>
                                        <i className="fa fa-magic text-primary me-2"></i>AI Recommendations
                                    </h4>
                                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '-10px', marginBottom: '20px' }}>
                                        Semantically matched using deep book description vector embeddings.
                                    </p>
                                    {similarBooks.length === 0 ? (
                                        <p className="text-muted" style={{ fontSize: '13px' }}>Generating suggestions...</p>
                                    ) : (
                                        <div className="similar-books-list">
                                            {similarBooks.map((simBook) => (
                                                <Link 
                                                    key={simBook.id} 
                                                    href={`/shop-detail/${simBook.id}`}
                                                    style={{ 
                                                        display: 'flex', 
                                                        gap: '15px', 
                                                        marginBottom: '20px', 
                                                        textDecoration: 'none', 
                                                        color: 'inherit',
                                                        transition: 'transform 0.2s',
                                                        cursor: 'pointer'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                                                >
                                                    <img 
                                                        src={simBook.coverUrl} 
                                                        alt={simBook.title} 
                                                        style={{ 
                                                            width: '60px', 
                                                            height: '85px', 
                                                            objectFit: 'cover', 
                                                            borderRadius: '6px',
                                                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                                                        }} 
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h6 style={{ 
                                                            fontSize: '14px', 
                                                            fontWeight: '600', 
                                                            margin: '0 0 4px 0',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis'
                                                        }}>
                                                            {simBook.title}
                                                        </h6>
                                                        <p className="text-muted" style={{ fontSize: '12px', margin: '0 0 6px 0' }}>
                                                            By {simBook.author}
                                                        </p>
                                                        <span className="price" style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff5e5e' }}>
                                                            ${simBook.price}
                                                        </span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        </FadeIn>
                    </div>
                </section>        
                <NewsLetter />      
            </div>
        </>
    )
}
export default ShopDetail;
