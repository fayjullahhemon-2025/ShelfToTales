'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageTitle from '../components/layout/PageTitle';
import { bookService, comparisonService } from '../lib/api';
import { FadeIn } from '../components/common/AnimationUtils';
import { useAuthToken } from '../hooks/useAuthToken';

function ProductComparisonInner() {
    const [comparisonList, setComparisonList] = useState([]);
    const [availableBooks, setAvailableBooks] = useState([]);
    const [token] = useAuthToken();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await bookService.getAll();
                setAvailableBooks(response.data.content || response.data || []);
            } catch (error) {
                console.error('Error fetching books:', error);
            }
        };
        fetchBooks();

        const fetchComparison = async () => {
            if (token) {
                try {
                    const response = await comparisonService.getComparisonList();
                    setComparisonList(response.data || []);
                } catch (error) {
                    console.error('Error fetching backend comparison list:', error);
                    // fallback
                    const storedComparison = JSON.parse(localStorage.getItem('comparisonList') || '[]');
                    setComparisonList(storedComparison);
                }
            } else {
                const storedComparison = JSON.parse(localStorage.getItem('comparisonList') || '[]');
                setComparisonList(storedComparison);
            }
        };
        fetchComparison();
    }, [token]);

    const addToComparison = async (bookId) => {
        if (comparisonList.length >= 4) {
            alert('You can only compare up to 4 books at a time.');
            return;
        }
        
        const bookToAdd = availableBooks.find(b => b.id === parseInt(bookId, 10));
        if (!bookToAdd) return;

        if (token) {
            try {
                await comparisonService.addToComparison(bookId);
                const response = await comparisonService.getComparisonList();
                setComparisonList(response.data || []);
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to add book to comparison list.');
            }
        } else {
            if (!comparisonList.find(b => b.id === bookToAdd.id)) {
                const newList = [...comparisonList, bookToAdd];
                setComparisonList(newList);
                localStorage.setItem('comparisonList', JSON.stringify(newList));
            }
        }
    };

    const removeFromComparison = async (id) => {
        if (token) {
            try {
                await comparisonService.removeFromComparison(id);
                const response = await comparisonService.getComparisonList();
                setComparisonList(response.data || []);
            } catch (error) {
                console.error('Error removing from comparison:', error);
            }
        } else {
            const newList = comparisonList.filter(item => item.id !== id);
            setComparisonList(newList);
            localStorage.setItem('comparisonList', JSON.stringify(newList));
        }
    };

    const clearComparison = async () => {
        if (token) {
            try {
                await comparisonService.clearComparison();
                setComparisonList([]);
            } catch (error) {
                console.error('Error clearing comparison:', error);
            }
        } else {
            setComparisonList([]);
            localStorage.setItem('comparisonList', JSON.stringify([]));
        }
    };

    return (
        <div className="page-content bg-grey">
            <PageTitle parentPage="Shop" childPage="Product Comparison" />
            <FadeIn>
            <div className="container py-5">
                <div className="row mb-5">
                    <div className="col-lg-12 d-flex justify-content-between align-items-center">
                        <h2 className="title mb-0">Compare Books</h2>
                        <button className="btn btn-outline-danger" onClick={clearComparison}>Clear All</button>
                    </div>
                </div>

                {comparisonList.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="fa-solid fa-code-compare fa-4x text-muted mb-4"></i>
                        <h3>Your comparison list is empty</h3>
                        <p className="text-muted">Add some books from the shop to compare their features.</p>
                        <Link href="/books-grid-view" className="btn btn-primary mt-3">Back to Shop</Link>
                    </div>
                ) : (
                    <div className="table-responsive bg-white rounded shadow-sm">
                        <table className="table table-bordered mb-0">
                            <thead>
                                <tr>
                                    <th style={{ width: '200px', backgroundColor: '#f8f9fa' }}>Feature</th>
                                    {comparisonList.map(book => (
                                        <th key={book.id} className="text-center p-4">
                                            <div className="position-relative">
                                                <button 
                                                    className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                                    onClick={() => removeFromComparison(book.id)}
                                                    style={{ marginTop: '-20px', marginRight: '-20px' }}
                                                >
                                                    <i className="fa-solid fa-xmark"></i>
                                                </button>
                                                <img loading="lazy" decoding="async" src={book.coverUrl} alt={book.title} className="img-fluid mb-3 rounded" style={{ height: '150px' }} />
                                                <h6 className="mb-0">{book.title}</h6>
                                                <span className="text-primary font-weight-bold">${book.price}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="bg-light font-weight-bold">Author</td>
                                    {comparisonList.map(book => <td key={book.id} className="text-center">{book.author}</td>)}
                                </tr>
                                <tr>
                                    <td className="bg-light font-weight-bold">Category</td>
                                    {comparisonList.map(book => <td key={book.id} className="text-center">{book.category?.name || book.categoryName}</td>)}
                                </tr>
                                <tr>
                                    <td className="bg-light font-weight-bold">Description</td>
                                    {comparisonList.map(book => (
                                        <td key={book.id} className="text-center small">
                                            {book.description?.substring(0, 100)}...
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="bg-light font-weight-bold">Action</td>
                                    {comparisonList.map(book => (
                                        <td key={book.id} className="text-center">
                                            <Link href={`/books-detail/${book.id}`} className="btn btn-primary btn-sm btnhover">View Details</Link>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Add More Section */}
                <div className="mt-5">
                    <h4>Add More Books to Compare</h4>
                    <div className="row mt-3">
                        {availableBooks.slice(0, 4).map(book => (
                            <div className="col-lg-3 col-md-6 mb-4" key={book.id}>
                                <div className="card h-100 shadow-sm border-0 p-3 text-center">
                                    <img loading="lazy" decoding="async" src={book.coverUrl} alt={book.title} className="rounded mb-2" style={{ height: '120px', objectFit: 'contain' }} />
                                    <h6 className="small">{book.title}</h6>
                                    <button 
                                        className="btn btn-outline-primary btn-sm mt-2"
                                        onClick={() => addToComparison(book.id)}
                                        disabled={!!comparisonList.find(b => b.id === book.id)}
                                    >
                                        {comparisonList.find(b => b.id === book.id) ? 'Added' : 'Add to Compare'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            </FadeIn>
        </div>
    );
}

import ClientOnly from '../components/ClientOnly';
export default function ProductComparison() {
  return <ClientOnly><ProductComparisonInner /></ClientOnly>;
}
