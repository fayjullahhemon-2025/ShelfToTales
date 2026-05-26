'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import './FlipbookReader.css';

// Sample book data with mock page counts (module-level constant — stable across renders)
const BOOK_DATA = {
    'demo-1': { title: 'The Great Gatsby', pages: 12 },
    'demo-2': { title: '1984', pages: 15 },
    'demo-3': { title: 'To Kill a Mockingbird', pages: 10 },
    'demo-4': { title: 'The Art of War', pages: 8 },
    'demo-5': { title: 'Digital Fortress', pages: 14 }
};

const FlipbookReaderInner = () => {
    const { bookId } = useParams();
    const router = useRouter();
    const location = useLocation();
    const [pdfPages, setPdfPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFlipping, setIsFlipping] = useState(false);
    const [theme, setTheme] = useState('glass');
    const flipbookRef = useRef(null);

    // Get theme from location state or default to glass
    useEffect(() => {
        if (location.state?.theme) {
            setTheme(location.state.theme);
        }
    }, [location.state]);

    useEffect(() => {
        const loadBookPages = async () => {
        try {
            setIsLoading(true);
            const book = BOOK_DATA[bookId] || BOOK_DATA['demo-2'];
            const pageCount = book.pages;
            
            setTotalPages(pageCount);
            
            // Generate mock page images (in real app, these would be converted from PDF)
            const pages = [];
            for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
                // Create a simple page image with text content
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 400;
                canvas.height = 550;
                
                // White background
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add page border
                context.strokeStyle = '#cccccc';
                context.lineWidth = 2;
                context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
                
                // Add page content
                context.fillStyle = '#333333';
                context.font = '16px Arial';
                context.textAlign = 'center';
                
                // Title
                context.font = 'bold 24px Arial';
                context.fillText(book.title, canvas.width / 2, 50);
                
                // Page number
                context.font = '14px Arial';
                context.fillText(`Page ${pageNum}`, canvas.width / 2, canvas.height - 30);
                
                // Sample text content
                context.font = '12px Arial';
                context.textAlign = 'left';
                const sampleText = `This is page ${pageNum} of "${book.title}". In a real implementation, this would be the actual content from the PDF file. For now, this is a placeholder to demonstrate the flipbook functionality.`;
                
                // Wrap text
                const words = sampleText.split(' ');
                let line = '';
                let y = 100;
                const lineHeight = 20;
                const maxWidth = canvas.width - 60;
                
                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        context.fillText(line, 30, y);
                        line = words[n] + ' ';
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                context.fillText(line, 30, y);
                
                pages.push(canvas.toDataURL());
            }
            
            setPdfPages(pages);
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading book pages:', error);
            setIsLoading(false);
        }
        };
        loadBookPages();
    }, [bookId]);

    const handleNextPage = () => {
        if (currentPage < totalPages - 2 && !isFlipping) {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPage(prev => prev + 2);
                setIsFlipping(false);
            }, 600);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0 && !isFlipping) {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPage(prev => prev - 2);
                setIsFlipping(false);
            }, 600);
        }
    };

    const handleGoToPage = (pageNum) => {
        if (!isFlipping && pageNum >= 0 && pageNum < totalPages) {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentPage(Math.floor(pageNum / 2) * 2);
                setIsFlipping(false);
            }, 600);
        }
    };

    const renderPageSpread = () => {
        const leftPage = pdfPages[currentPage];
        const rightPage = pdfPages[currentPage + 1];

        return (
            <div className="flipbook-spread">
                <div className={`page left-page ${isFlipping ? 'flipping' : ''}`}>
                    {leftPage && (
                        <img loading="lazy" decoding="async" src={leftPage} alt={`Page ${currentPage + 1}`} className="page-image" />
                    )}
                    <div className="page-number">{currentPage + 1}</div>
                </div>
                <div className="page-spine"></div>
                <div className={`page right-page ${isFlipping ? 'flipping' : ''}`}>
                    {rightPage && (
                        <img loading="lazy" decoding="async" src={rightPage} alt={`Page ${currentPage + 2}`} className="page-image" />
                    )}
                    <div className="page-number">{currentPage + 2}</div>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flipbook-reader loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading book...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flipbook-reader theme-${theme}`}>
            <div className="flipbook-header">
                <button className="back-btn" onClick={() => router.push('/virtual-bookshelf')}>
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Bookshelf
                </button>
                <h2 className="book-title">Digital Reader</h2>
                <div className="page-info">
                    Page {currentPage + 1}-{Math.min(currentPage + 2, totalPages)} of {totalPages}
                </div>
            </div>

            <div className="flipbook-container" ref={flipbookRef}>
                <div className="flipbook-controls">
                    <button 
                        className="nav-btn prev-btn" 
                        onClick={handlePrevPage}
                        disabled={currentPage === 0 || isFlipping}
                    >
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    
                    <button 
                        className="nav-btn next-btn" 
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 2 || isFlipping}
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>

                <div className="flipbook-pages">
                    {renderPageSpread()}
                </div>

                <div className="page-navigation">
                    <div className="page-thumbnails">
                        {pdfPages.map((page, index) => (
                            <button
                                key={index}
                                className={`thumbnail ${Math.floor(currentPage / 2) === Math.floor(index / 2) ? 'active' : ''}`}
                                onClick={() => handleGoToPage(index)}
                            >
                                <img loading="lazy" decoding="async" src={page} alt={`Page ${index + 1}`} />
                                <span>{index + 1}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

import ClientOnly from '../../components/ClientOnly';
import { FadeIn } from '../../components/common/AnimationUtils';
export default function FlipbookReader() {
  return <ClientOnly><FlipbookReaderInner /></ClientOnly>;
}


