'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { bookService, bookshelfService } from '../lib/api';
import './VirtualBookshelf.css';
import Swal from 'sweetalert2';
import { useLofi } from '../contexts/LofiContext';
const logoImage = '/assets/images/logo.png';
// Professional Demo Books (fallback if API fails)
const FALLBACK_IMG = 'https://picsum.photos/seed';
const demoBooksList = [
    { id: 'demo-1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', imageUrl: `${FALLBACK_IMG}/gatsby/250/350`, createdAt: '2024-01-01', hidden: false },
    { id: 'demo-2', title: '1984', author: 'George Orwell', imageUrl: `${FALLBACK_IMG}/1984/250/350`, createdAt: '2024-02-01', hidden: false },
    { id: 'demo-3', title: 'To Kill a Mockingbird', author: 'Harper Lee', imageUrl: `${FALLBACK_IMG}/mockingbird/250/350`, createdAt: '2024-03-01', hidden: false },
    { id: 'demo-4', title: 'The Art of War', author: 'Sun Tzu', imageUrl: `${FALLBACK_IMG}/war/250/350`, createdAt: '2024-04-01', hidden: false },
    { id: 'demo-5', title: 'Digital Fortress', author: 'Dan Brown', imageUrl: `${FALLBACK_IMG}/fortress/250/350`, createdAt: '2024-05-01', hidden: false }
];

function VirtualBookshelfInner() {
    const router = useRouter();
    // User-scoped localStorage keys
    const uid = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}').id || 'guest'; } catch { return 'guest'; } })();
    const ukey = (k) => `${k}_${uid}`;

    const [view, setView] = useState('library');

    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        currentTrack,
        nextTrack,
        prevTrack,
        togglePlay,
        setVolume,
        seek
    } = useLofi();

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds) || timeInSeconds === null) return "00:00";
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const [books, setBooks] = useState([]);
    const [originalBooks, setOriginalBooks] = useState([]);
    const [allCatalogBooks, setAllCatalogBooks] = useState([]);
    const [activeTab, setActiveTab] = useState('ALL');
    const [selectedBookForModal, setSelectedBookForModal] = useState(null);
    const [modalStatus, setModalStatus] = useState('NOT_STARTED');
    const [modalNotes, setModalNotes] = useState('');
    const [currentBook, setCurrentBook] = useState(null);
    const [searchQuery] = useState('');
    const [isSortedNewest, setIsSortedNewest] = useState(() => localStorage.getItem(ukey('vbookshelf_sort')) !== 'false');
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem(ukey('vbookshelf_logo')) || logoImage);
    const [menuVisibility, setMenuVisibility] = useState(() => {
        try { return JSON.parse(localStorage.getItem(ukey('vbookshelf_menu')) || 'null') || { logo: true, title: true, search: true, share: true }; }
        catch { return { logo: true, title: true, search: true, share: true }; }
    });
    const [activeSection, setActiveSection] = useState('info');
    const [bookshelves, setBookshelves] = useState([]);
    const [activeBookshelfId, setActiveBookshelfId] = useState(null);
    const [loadingShelves, setLoadingShelves] = useState(true);

    // Decor state
    const [wallpaper, setWallpaper] = useState(() => localStorage.getItem(ukey('vbookshelf_wallpaper')) || 'none');
    const [shelfColor, setShelfColor] = useState(() => localStorage.getItem(ukey('vbookshelf_shelfcolor')) || '#8B4513');
    const [bookSize, setBookSize] = useState(() => parseInt(localStorage.getItem(ukey('vbookshelf_booksize')) || '100'));
    const [lighting, setLighting] = useState(() => localStorage.getItem(ukey('vbookshelf_lighting')) || 'none');
    const [showLabels, setShowLabels] = useState(() => localStorage.getItem(ukey('vbookshelf_labels')) !== 'false');
    const [particles, setParticles] = useState(() => localStorage.getItem(ukey('vbookshelf_particles')) || 'none');
    const [ornaments, setOrnaments] = useState(() => { try { return JSON.parse(localStorage.getItem(ukey('vbookshelf_ornaments'))) || []; } catch { return []; } });
    const [seasonal, setSeasonal] = useState(() => localStorage.getItem(ukey('vbookshelf_seasonal')) || 'none');

    const sidebarSections = [
        { id: 'info', title: 'Bookshelf info', icon: 'fa-solid fa-circle-info' },
        { id: 'manage', title: 'Manage flipbooks', icon: 'fa-solid fa-square-plus' },
        { id: 'position', title: 'Books position', icon: 'fa-solid fa-up-down-left-right' },
        { id: 'design', title: 'Shelf Theme', icon: 'fa-solid fa-palette' },
        { id: 'decor', title: 'Decor & Background', icon: 'fa-solid fa-wand-magic-sparkles' },
        { id: 'logo', title: 'Add logo', icon: 'fa-solid fa-image' },
        { id: 'menu', title: 'Menu', icon: 'fa-solid fa-bars' }
    ];

    const logoInputRef = useRef(null);
    const saveShelfRef = useRef(null);

    const saveShelf = (id, updates) => {
        if (saveShelfRef.current) clearTimeout(saveShelfRef.current);
        saveShelfRef.current = setTimeout(async () => {
            try {
                await bookshelfService.update(id, updates);
            } catch (err) {
                console.error('Failed to save shelf to backend:', err.response?.data || err.message);
            }
        }, 500);
    };

    // Persist menu visibility, logo URL, and theme
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_menu'), JSON.stringify(menuVisibility)); }, [menuVisibility]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_logo'), logoUrl); }, [logoUrl]);
    useEffect(() => { if (activeShelf?.theme) localStorage.setItem(ukey('vbookshelf_theme'), activeShelf.theme); }, [bookshelves, activeBookshelfId]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_wallpaper'), wallpaper); }, [wallpaper]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_shelfcolor'), shelfColor); }, [shelfColor]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_booksize'), bookSize.toString()); }, [bookSize]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_lighting'), lighting); }, [lighting]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_labels'), showLabels.toString()); }, [showLabels]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_particles'), particles); }, [particles]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_ornaments'), JSON.stringify(ornaments)); }, [ornaments]);
    useEffect(() => { localStorage.setItem(ukey('vbookshelf_seasonal'), seasonal); }, [seasonal]);

    const fetchShelfBooks = async (shelfId) => {
        if (!shelfId) return;
        try {
            const res = await bookshelfService.getBooks(shelfId);
            const shelfData = res.data || [];
            const mapped = shelfData.map(b => ({
                id: b.id?.toString() || Math.random().toString(),
                bookId: b.bookId,
                title: b.title || 'Untitled',
                author: b.author || 'Unknown',
                imageUrl: b.coverUrl || `${FALLBACK_IMG}/${(b.title || 'book').replace(/\s+/g, '-')}/250/350`,
                readingStatus: b.readingStatus || 'NOT_STARTED',
                notes: b.notes || '',
                createdAt: b.addedAt || new Date().toISOString(),
                hidden: false
            }));
            setOriginalBooks(mapped);
            if (mapped.length > 0 && !currentBook) {
                setCurrentBook(mapped[0]);
            }
        } catch (err) {
            console.error('Failed to fetch shelf books:', err);
        }
    };

    // Load catalog books and bookshelves on mount
    useEffect(() => {
        const initializeBookshelf = async () => {
            try {
                // Fetch catalog books
                const catalogRes = await bookService.getMyBooks().catch(() => ({ data: { content: [] } }));
                const catalogData = catalogRes.data?.content || catalogRes.data || [];
                setAllCatalogBooks(catalogData.map(b => ({
                    id: b.id,
                    title: b.title || 'Untitled',
                    author: b.author || 'Unknown',
                    imageUrl: b.coverUrl || `${FALLBACK_IMG}/${(b.title || 'book').replace(/\s+/g, '-')}/250/350`
                })));

                // Fetch shelves
                const shelvesRes = await bookshelfService.getAll().catch(() => ({ data: [] }));
                const shelfData = shelvesRes.data || [];
                if (shelfData.length > 0) {
                    setBookshelves(shelfData.map(s => ({ ...s, isFolded: false, description: s.description || '' })));
                    setActiveBookshelfId(shelfData[0].id);
                } else {
                    try {
                        const newShelf = await bookshelfService.create({ name: 'Main Bookshelf' });
                        setBookshelves([{ ...newShelf.data, isFolded: false, description: '' }]);
                        setActiveBookshelfId(newShelf.data.id);
                    } catch (_) {
                        const fb = { id: Date.now(), name: 'Main Bookshelf', description: '', isFolded: false, theme: localStorage.getItem(ukey('vbookshelf_theme')) || 'glass' };
                        setBookshelves([fb]);
                        setActiveBookshelfId(fb.id);
                    }
                }
            } catch (error) {
                console.error('Initialize error:', error);
                setAllCatalogBooks([]);
                const fb = { id: Date.now(), name: 'Main Bookshelf', description: '', isFolded: false, theme: localStorage.getItem(ukey('vbookshelf_theme')) || 'glass' };
                setBookshelves([fb]);
                setActiveBookshelfId(fb.id);
            } finally {
                setLoadingShelves(false);
            }
        };
        initializeBookshelf();
    }, []);

    // Fetch shelf books when activeBookshelfId changes
    useEffect(() => {
        if (activeBookshelfId) {
            fetchShelfBooks(activeBookshelfId);
        }
    }, [activeBookshelfId]);

    // Reactive filtering and sorting
    useEffect(() => {
        let filtered = [...originalBooks];
        if (searchQuery) {
            filtered = filtered.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (activeTab && activeTab !== 'ALL') {
            filtered = filtered.filter(b => b.readingStatus === activeTab);
        }
        filtered.sort((a, b) => isSortedNewest ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
        setBooks(filtered);
    }, [originalBooks, searchQuery, isSortedNewest, activeTab]);

    // Cleanup saveShelf debounce on unmount
    useEffect(() => {
        return () => { if (saveShelfRef.current) clearTimeout(saveShelfRef.current); };
    }, []);

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (upload) => setLogoUrl(upload.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleReadBook = (book) => {
        setCurrentBook(book);
        setView('reader');
    };

    const toggleSort = () => {
        const n = !isSortedNewest;
        setIsSortedNewest(n);
        localStorage.setItem(ukey('vbookshelf_sort'), n);
    };

    const toggleBookOnShelf = async (bookId) => {
        if (!activeBookshelfId) return;
        const exists = originalBooks.find(ob => ob.bookId === bookId);
        if (exists) {
            try {
                await bookshelfService.removeBook(activeBookshelfId, bookId);
                fetchShelfBooks(activeBookshelfId);
            } catch (err) {
                Swal.fire('Error', 'Failed to remove book from bookshelf', 'error');
            }
        } else {
            try {
                await bookshelfService.addBook(activeBookshelfId, bookId);
                fetchShelfBooks(activeBookshelfId);
            } catch (err) {
                Swal.fire('Error', 'Failed to add book to bookshelf', 'error');
            }
        }
    };

    const moveBook = (index, direction) => {
        const t = direction === 'up' ? index - 1 : index + 1;
        if (t < 0 || t >= books.length) return;
        const newBooks = [...books];
        [newBooks[index], newBooks[t]] = [newBooks[t], newBooks[index]];
        setBooks(newBooks);
        setOriginalBooks(newBooks);
        localStorage.setItem(ukey('vbookshelf_order'), JSON.stringify(newBooks.map(b => b.id)));
    };

    const addNewBookshelf = async () => {
        try {
            const res = await bookshelfService.create({ name: `New Bookshelf ${bookshelves.length + 1}` });
            const newShelf = { ...res.data, isFolded: false, description: '' };
            setBookshelves([...bookshelves, newShelf]);
            setActiveBookshelfId(newShelf.id);
        } catch (err) {
            Swal.fire('Error', 'Failed to create bookshelf', 'error');
        }
    };

    const removeBookshelf = async (id) => {
        if (bookshelves.length === 1) return;
        Swal.fire({ title: 'Remove Bookshelf?', icon: 'warning', showCancelButton: true }).then(async (r) => {
            if (r.isConfirmed) {
                try {
                    await bookshelfService.delete(id);
                    const n = bookshelves.filter(s => s.id !== id);
                    setBookshelves(n);
                    if (activeBookshelfId === id) setActiveBookshelfId(n[0].id);
                } catch (err) {
                    console.error('Delete bookshelf error (removing locally):', err.response?.data || err.message);
                    const n = bookshelves.filter(s => s.id !== id);
                    setBookshelves(n);
                    if (activeBookshelfId === id) setActiveBookshelfId(n[0]?.id || null);
                }
            }
        });
    };

    const updateActiveShelf = (updates) => {
        setBookshelves(prev => prev.map(s => s.id === activeBookshelfId ? { ...s, ...updates } : s));
        if (activeBookshelfId) saveShelf(activeBookshelfId, updates);
    };

    const activeShelf = bookshelves.find(s => s.id === activeBookshelfId) || bookshelves[0] || { theme: 'glass', name: 'Bookshelf' };

    const handleOpenModal = (book) => {
        setSelectedBookForModal(book);
        setModalStatus(book.readingStatus || 'NOT_STARTED');
        setModalNotes(book.notes || '');
    };

    const handleSaveModal = async () => {
        if (!selectedBookForModal || !activeBookshelfId) return;
        try {
            await Promise.all([
                bookshelfService.updateBookStatus(activeBookshelfId, selectedBookForModal.bookId, modalStatus),
                bookshelfService.updateBookNotes(activeBookshelfId, selectedBookForModal.bookId, modalNotes)
            ]);
            Swal.fire({
                icon: 'success',
                title: 'Book updated successfully',
                toast: true,
                position: 'top-end',
                timer: 2000,
                showConfirmButton: false
            });
            setSelectedBookForModal(null);
            fetchShelfBooks(activeBookshelfId);
        } catch (err) {
            Swal.fire('Error', 'Failed to update book details', 'error');
        }
    };

    const statusTabs = [
        { id: 'ALL', label: 'All' },
        { id: 'WANT_TO_READ', label: 'Want Next' },
        { id: 'IN_PROGRESS', label: 'Reading' },
        { id: 'COMPLETED', label: 'Completed' }
    ];

    if (loadingShelves) {
        return (
            <div className="bookshelf-container theme-glass d-flex align-items-center justify-content-center" style={{minHeight: '100vh'}}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status"><span className="visually-hidden">Loading...</span></div>
                    <p className="text-muted">Loading your bookshelves...</p>
                </div>
            </div>
        );
    }

    const renderLibrary = () => {
        const visibleBooks = books;
        if (visibleBooks.length === 0) return <div className="text-center p-5"><h3 style={{color: '#fff'}}>No books visible</h3></div>;
        const totalRegularShelves = Math.max(2, Math.ceil((visibleBooks.length - 1) / 4));
        const ornamentEmojis = {plant:'🪴',candle:'🕯️',globe:'🌍',clock:'🕰️',cat:'🐱',coffee:'☕',frame:'🖼️',lamp:'💡'};

        return (
            <div className="library-view animate__animated animate__fadeIn">
                {/* Particle overlay */}
                {particles !== 'none' && <div className={`particle-overlay particle-${particles}`}>{Array.from({length:20}).map((_,i) => <span key={i} className="particle" style={{left:`${Math.random()*100}%`,animationDelay:`${Math.random()*5}s`,animationDuration:`${3+Math.random()*4}s`}}/>)}</div>}
                {/* Seasonal overlay */}
                {seasonal !== 'none' && <div className={`seasonal-overlay seasonal-${seasonal}`}/>}
                <div className="shelf-group hero-shelf-group">
                    <div className="hero-shelf-container">
                        <div className="hero-shelf-layout d-flex align-items-center justify-content-center gap-4 flex-wrap">
                            <div className="hero-text text-start" style={{minWidth: '200px', maxWidth: '350px'}}>
                                <h2 className="hero-book-title fw-bold" style={{wordBreak: 'break-word', fontSize: '1.5rem'}}><i className="fa-solid fa-bookmark me-3 opacity-25"></i>{visibleBooks[0].title}</h2>
                                <p className="text-muted small mb-1">by {visibleBooks[0].author}</p>
                                <button className="btn btn-sm btn-outline-primary mt-2 px-3 rounded-pill" onClick={() => handleOpenModal(visibleBooks[0])}>View Details</button>
                            </div>
                            <div className="bookshelf-book hero-book-main" onClick={() => handleOpenModal(visibleBooks[0])}><img loading="lazy" decoding="async" src={visibleBooks[0].imageUrl} alt="" /></div>
                        </div>
                    </div>
                    <div className={`shelf ${activeShelf.theme}`}></div>
                </div>
                {Array.from({ length: totalRegularShelves }).map((_, si) => (
                    <div key={si} className="shelf-group mt-5">
                        <div className="book-row">{visibleBooks.slice(1 + si * 4, 1 + (si + 1) * 4).map(b => (
                            <div key={b.id} className="book-with-header">
                                {showLabels && <div className="book-top-info px-2 py-1 mb-2 small fw-bold" style={{maxWidth: '90px', fontSize: '0.7rem', color: '#333', textAlign: 'center', lineHeight: '1.2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{b.title}</div>}
                                <div className="bookshelf-book" style={{transform: `scale(${bookSize/100})`}} onClick={() => handleOpenModal(b)}><img loading="lazy" decoding="async" src={b.imageUrl} alt="" /></div>
                            </div>
                        ))}
                        {/* Ornaments on this shelf */}
                        {si < 2 && ornaments.length > 0 && <div className="shelf-ornament">{ornaments.slice(si*2, si*2+2).map((o,i) => <span key={i} className="ornament-item">{ornamentEmojis[o]}</span>)}</div>}
                        </div>
                        <div className={`shelf ${activeShelf.theme}`}></div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className={`bookshelf-container theme-${activeShelf.theme} wallpaper-${wallpaper} lighting-${lighting} particles-${particles} seasonal-${seasonal}`} style={{'--shelf-color': shelfColor, '--book-scale': String(bookSize/100)}}>
            <div className="bookshelf-sidebar">
                <div className="sidebar-header-new">
                    <h5 className="text-white fw-bold mb-3">BOOKSHELVES</h5>
                    <button className="btn btn-primary w-100 mb-4 rounded-pill" onClick={addNewBookshelf}>ADD NEW</button>
                </div>
                <div className="bookshelf-list-container px-2">
                    {bookshelves.map(shelf => (
                        <div key={shelf.id} className={`bookshelf-item-active mb-3 ${activeBookshelfId === shelf.id ? 'active-shelf' : ''}`}>
                            <div className="item-info p-3 d-flex justify-content-between align-items-center cursor-pointer" onClick={() => setActiveBookshelfId(shelf.id)}>
                                <div><small className="text-muted d-block" style={{fontSize: '0.6rem'}}>BOOKSHELF {shelf.id}</small><span className="fw-bold">{shelf.name}</span></div>
                                <i className={`fa-solid fa-chevron-${shelf.isFolded ? 'down' : 'up'} text-muted`} onClick={(e) => { e.stopPropagation(); setBookshelves(p => p.map(s => s.id === shelf.id ? {...s, isFolded: !s.isFolded} : s)) }}></i>
                            </div>
                            {!shelf.isFolded && activeBookshelfId === shelf.id && (
                                <div className="shelf-expanded-content p-2">
                                    <div className="sidebar-accordion">
                                        {sidebarSections.map(section => (
                                            <div key={section.id} className={`accordion-item-custom ${activeSection === section.id ? 'active' : ''}`}>
                                                <div className="accordion-header-custom" onClick={() => setActiveSection(activeSection === section.id ? '' : section.id)}>
                                                    <i className={section.icon}></i>
                                                    <strong className="ms-2 text-white">{section.title}</strong>
                                                    <i className={`fa-solid fa-chevron-${activeSection === section.id ? 'up' : 'down'} ms-auto small opacity-50`}></i>
                                                </div>
                                                {activeSection === section.id && (
                                                    <div className="accordion-body-custom p-3 bg-dark bg-opacity-25 rounded mb-2 animate__animated animate__fadeIn">
                                                        {section.id === 'info' && (
                                                            <>
                                                                <input type="text" className="form-control form-control-sm bg-dark text-white border-secondary mb-2" value={shelf.name} onChange={(e) => updateActiveShelf({name: e.target.value})} />
                                                                <textarea className="form-control form-control-sm bg-dark text-white border-secondary" rows="2" value={shelf.description || ''} onChange={(e) => updateActiveShelf({description: e.target.value})} />
                                                            </>
                                                        )}
                                                        {section.id === 'manage' && (
                                                            <>
                                                                <div className="form-check form-switch small mb-3">
                                                                    <input className="form-check-input" type="checkbox" checked={isSortedNewest} onChange={toggleSort} /><label className="form-check-label text-white fw-bold ms-2">Newest first</label>
                                                                </div>
                                                                <div className="mini-book-list" style={{maxHeight: '180px', overflowY: 'auto'}}>
                                                                    {allCatalogBooks.map(cb => {
                                                                        const isChecked = originalBooks.some(ob => ob.bookId === cb.id);
                                                                        return (
                                                                            <div key={cb.id} className="d-flex align-items-center justify-content-between mb-3 px-1 border-bottom border-secondary pb-2">
                                                                                <span className="small text-truncate flex-grow-1" style={{fontSize: '0.8rem', color: '#fff'}}>{cb.title}</span>
                                                                                <input className="form-check-input" type="checkbox" checked={isChecked} onChange={() => toggleBookOnShelf(cb.id)} />
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </>
                                                        )}
                                                        {section.id === 'position' && (
                                                            <div className="mini-book-list" style={{maxHeight: '180px', overflowY: 'auto'}}>
                                                                {books.map((b, i) => (
                                                                    <div key={b.id} className="d-flex align-items-center justify-content-between mb-3 px-1 border-bottom border-secondary pb-2">
                                                                        <span className="small text-truncate flex-grow-1" style={{fontSize: '0.8rem', color: '#fff'}}>{b.title}</span>
                                                                        <div className="d-flex gap-3">
                                                                            <i className="fa-solid fa-chevron-up orange-text cursor-pointer" onClick={() => moveBook(i, 'up')}></i>
                                                                            <i className="fa-solid fa-chevron-down orange-text cursor-pointer" onClick={() => moveBook(i, 'down')}></i>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {section.id === 'logo' && <button className="btn btn-sm btn-primary w-100 rounded-pill" onClick={() => logoInputRef.current.click()}>Upload Logo</button>}
                                                        {section.id === 'design' && (
                                                            <div>
                                                                <label className="small text-white-50 mb-2 d-block">Shelf Style</label>
                                                                <div className="theme-thumbs-grid">{['glass', 'wood', 'carbon', 'marble', 'dark'].map(t => <div key={t} className={`theme-thumb ${activeShelf.theme === t ? 'active' : ''}`} onClick={() => updateActiveShelf({theme: t})}><div className={`${t}-preview`}></div><small className="text-white-50 d-block text-center mt-1" style={{fontSize:'0.6rem',textTransform:'capitalize'}}>{t}</small></div>)}</div>
                                                                <label className="small text-white-50 mb-2 mt-3 d-block">Shelf Color</label>
                                                                <div className="d-flex gap-2 flex-wrap">
                                                                    {['#8B4513','#2c1810','#d4a574','#1a1a2e','#4a5568','#c0392b','#2d3436'].map(c => (
                                                                        <div key={c} onClick={() => setShelfColor(c)} className="cursor-pointer" style={{width:28,height:28,borderRadius:8,background:c,border:shelfColor===c?'2px solid #eaa451':'2px solid transparent',transition:'all 0.2s'}}/>
                                                                    ))}
                                                                </div>
                                                                <label className="small text-white-50 mb-2 mt-3 d-block">Book Size</label>
                                                                <input type="range" className="form-range" min="70" max="140" value={bookSize} onChange={e => setBookSize(parseInt(e.target.value))}/>
                                                                <div className="d-flex justify-content-between"><small className="text-white-50">Small</small><small className="text-white-50">Large</small></div>
                                                                <div className="form-check form-switch mt-3">
                                                                    <input className="form-check-input" type="checkbox" checked={showLabels} onChange={() => setShowLabels(!showLabels)}/>
                                                                    <label className="form-check-label text-white small">Show book titles</label>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {section.id === 'decor' && (
                                                            <div>
                                                                <label className="small text-white-50 mb-2 d-block">Wallpaper</label>
                                                                <div className="d-flex gap-2 flex-wrap mb-3">
                                                                    {[{id:'none',label:'None',bg:'#1a1a2e'},{id:'cozy',label:'Cozy',bg:'linear-gradient(135deg,#3d2914,#1a0f07)'},{id:'library',label:'Library',bg:'linear-gradient(135deg,#1a1a2e,#2d2b55)'},{id:'nature',label:'Nature',bg:'linear-gradient(135deg,#1b4332,#081c15)'},{id:'sunset',label:'Sunset',bg:'linear-gradient(135deg,#5c2018,#1a0505)'},{id:'ocean',label:'Ocean',bg:'linear-gradient(135deg,#0a2647,#051937)'}].map(w => (
                                                                        <div key={w.id} onClick={() => setWallpaper(w.id)} className="cursor-pointer text-center" style={{width:44}}>
                                                                            <div style={{width:40,height:40,borderRadius:10,background:w.bg,border:wallpaper===w.id?'2px solid #eaa451':'2px solid rgba(255,255,255,0.1)',transition:'all 0.2s'}}/>
                                                                            <small className="text-white-50 d-block mt-1" style={{fontSize:'0.55rem'}}>{w.label}</small>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <label className="small text-white-50 mb-2 d-block">Lighting Effect</label>
                                                                <div className="d-flex gap-2 flex-wrap mb-3">
                                                                    {[{id:'none',label:'Off',icon:'fa-circle-xmark'},{id:'warm',label:'Warm',icon:'fa-sun'},{id:'spotlight',label:'Spot',icon:'fa-lightbulb'},{id:'ambient',label:'Ambient',icon:'fa-moon'}].map(l => (
                                                                        <button key={l.id} onClick={() => setLighting(l.id)} className={`btn btn-sm ${lighting===l.id?'btn-warning':'btn-outline-secondary'} rounded-pill px-3`} style={{fontSize:'0.75rem'}}>
                                                                            <i className={`fa-solid ${l.icon} me-1`}/>{l.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <label className="small text-white-50 mb-2 d-block">Floating Particles</label>
                                                                <div className="d-flex gap-2 flex-wrap mb-3">
                                                                    {[{id:'none',label:'Off'},{id:'dust',label:'✨ Dust'},{id:'fireflies',label:'🪲 Fireflies'},{id:'snow',label:'❄️ Snow'},{id:'leaves',label:'🍂 Leaves'},{id:'stars',label:'⭐ Stars'}].map(p => (
                                                                        <button key={p.id} onClick={() => setParticles(p.id)} className={`btn btn-sm ${particles===p.id?'btn-warning':'btn-outline-secondary'} rounded-pill px-2`} style={{fontSize:'0.7rem'}}>
                                                                            {p.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <label className="small text-white-50 mb-2 d-block">Seasonal Theme</label>
                                                                <div className="d-flex gap-2 flex-wrap">
                                                                    {[{id:'none',label:'None'},{id:'christmas',label:'🎄 Holiday'},{id:'halloween',label:'🎃 Spooky'},{id:'spring',label:'🌸 Spring'},{id:'cozyfall',label:'🍁 Autumn'}].map(s => (
                                                                        <button key={s.id} onClick={() => setSeasonal(s.id)} className={`btn btn-sm ${seasonal===s.id?'btn-warning':'btn-outline-secondary'} rounded-pill px-2`} style={{fontSize:'0.7rem'}}>
                                                                            {s.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {section.id === 'menu' && (
                                                            <div className="menu-visibility-list">
                                                                {Object.keys(menuVisibility).map(key => (
                                                                    <div key={key} className="form-check d-flex align-items-center justify-content-between mb-3 px-1">
                                                                        <label className="form-check-label text-capitalize text-white fw-bold" style={{fontSize: '0.9rem'}}>{key}</label>
                                                                        <input className="form-check-input" type="checkbox" checked={menuVisibility[key]} onChange={() => setMenuVisibility({...menuVisibility, [key]: !menuVisibility[key]})} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="btn btn-outline-danger btn-sm w-100 rounded-pill mt-2" onClick={() => removeBookshelf(shelf.id)}><i className="fa-solid fa-trash me-2"></i>Remove</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <input type="file" ref={logoInputRef} className="d-none" onChange={handleLogoUpload} />

            <main className="bookshelf-main">
                <header className="main-header d-flex justify-content-between align-items-center mb-5 p-3 rounded-pill bg-white bg-opacity-10 shadow">
                    <div className="d-flex align-items-center gap-3">
                        {menuVisibility.logo && <img loading="lazy" decoding="async" src={logoUrl} alt="" style={{maxHeight: '30px'}} />}
                        {menuVisibility.title && <h5 className="mb-0 fw-bold">{activeShelf.name}</h5>}
                    </div>
                    <div className="d-flex gap-4">
                        {menuVisibility.search && <i className="fa-solid fa-search cursor-pointer"></i>}
                        {menuVisibility.share && <i className="fa-solid fa-share-nodes cursor-pointer"></i>}
                    </div>
                </header>
                {view === 'library' ? (
                    <>
                        <div className="status-tabs-container mb-4 d-flex justify-content-center gap-2">
                            {statusTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`btn btn-sm rounded-pill px-3 py-2 ${activeTab === tab.id ? 'btn-primary active-tab' : 'btn-outline-light'}`}
                                    style={{
                                        border: activeTab === tab.id ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                                        color: activeTab === tab.id ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                                        backgroundColor: activeTab === tab.id ? '#EAA451' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {renderLibrary()}
                    </>
                ) : (
                    <div className="reader-view-layout-wrapper animate__animated animate__fadeIn">
                        {/* Middle Part: Reader Content */}
                        <div className="reader-content-area" style={{ background: '#ffffff', color: '#000000', minHeight: '100%' }}>
                            <div className="d-flex align-items-center mb-5">
                                <button className="btn btn-link text-dark text-decoration-none p-0 me-4" onClick={() => setView('library')}>
                                    <i className="fa-solid fa-arrow-left"></i>
                                </button>
                                <div>
                                    <h4 className="fw-bold mb-0" style={{ color: '#000000' }}>{currentBook?.title}</h4>
                                    <span className="small text-muted text-uppercase">By {currentBook?.author}</span>
                                </div>
                                <div className="ms-auto d-flex gap-4 align-items-center text-muted">
                                    <i className="fa-solid fa-font cursor-pointer"></i>
                                    <i className="fa-solid fa-book-open cursor-pointer"></i>
                                    <i className="fa-solid fa-ellipsis-vertical cursor-pointer"></i>
                                </div>
                            </div>

                            <div className="text-center mb-5">
                                <img loading="lazy" decoding="async" src={currentBook?.imageUrl} alt="" className="img-fluid rounded shadow-lg mb-5" style={{ maxWidth: '300px' }} />
                            </div>

                            <div className="reader-text mx-auto" style={{ maxWidth: '700px', fontSize: '1.2rem', lineHeight: '1.8', color: '#000000' }}>
                                <p><span className="display-4 fw-bold float-start me-3" style={{ lineHeight: '0.8', color: '#000000' }}>T</span>he air in the Silent Library did not just carry silence; it carried the weight of a thousand unspoken thoughts. {currentBook?.author} moved his candle along the shelf, the flickering flame dancing across the spines of books that had not been opened in centuries. These were the Whispering Manuscripts—rare volumes rumored to contain the very echoes of their authors' final moments.</p>
                                <p>He stopped at a shelf made of dark, petrified oak. There, bound in silver-threaded silk, lay the journal of the last Archivist. As Elias reached out, a soft murmur seemed to fill the room, like the distant sound of waves crashing against a shore of glass. It wasn't sound, precisely, but a vibration in his marrow.</p>
                                <p>"Do you hear them too?" a voice asked from the shadows. Elias didn't startle; he had expected company. In the Silent Library, one was never truly alone.</p>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-5 pt-5 pb-5 mb-5">
                                <button className="btn btn-link text-dark text-decoration-none fw-bold" style={{ color: '#000000' }}><i className="fa-solid fa-chevron-left me-2"></i> Previous</button>
                                <div className="d-flex flex-column align-items-center gap-2">
                                    <span className="small text-muted">Page 114 of 342</span>
                                    <div className="progress" style={{ width: '200px', height: '4px' }}>
                                        <div className="progress-bar bg-dark" style={{ width: '33%' }}></div>
                                    </div>
                                </div>
                                <button className="btn btn-link text-dark text-decoration-none fw-bold" style={{ color: '#000000' }}>Next <i className="fa-solid fa-chevron-right ms-2"></i></button>
                            </div>
                        </div>

                        {/* Bottom Controls */}
                        <div className="reader-bottom-controls" style={{ position: 'sticky', bottom: 0, zIndex: 100, background: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                            <div className="d-flex align-items-center gap-3">
                                {currentTrack?.coverUrl ? (
                                    <img 
                                        src={currentTrack.coverUrl} 
                                        alt="" 
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <div className="bg-warning rounded-circle p-2 text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <i className="fa-solid fa-music"></i>
                                    </div>
                                )}
                                <div>
                                    <span className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.6rem' }}>
                                        {isPlaying ? 'Playing Lofi Session' : 'Lofi Session Paused'}
                                    </span>
                                    <h6 className="mb-0 fw-bold" style={{ color: '#000000' }}>
                                        {currentTrack?.title || "Autumn Rainfall"} - {formatTime(currentTime)} / {formatTime(duration)}
                                    </h6>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4 text-dark fs-5">
                                <i className="fa-solid fa-backward-step cursor-pointer" onClick={prevTrack}></i>
                                <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} cursor-pointer fs-3`} onClick={togglePlay}></i>
                                <i className="fa-solid fa-forward-step cursor-pointer" onClick={nextTrack}></i>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <i className="fa-solid fa-volume-high text-muted"></i>
                                <input 
                                    type="range" 
                                    className="form-range" 
                                    style={{ width: '100px', height: '4px', cursor: 'pointer' }}
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {selectedBookForModal && (
                <div className="modal-overlay d-flex align-items-center justify-content-center animate__animated animate__fadeIn" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    zIndex: 1000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="modal-content-custom bg-dark text-white p-4 rounded-4 shadow-lg border border-secondary" style={{
                        maxWidth: '500px',
                        width: '95%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h4 className="fw-bold mb-0 text-white">Book Details</h4>
                            <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedBookForModal(null)} aria-label="Close" style={{ filter: 'invert(1)' }}></button>
                        </div>
                        
                        <div className="text-center mb-4">
                            <img 
                                src={selectedBookForModal.imageUrl} 
                                alt={selectedBookForModal.title} 
                                className="img-fluid rounded shadow" 
                                style={{ maxHeight: '180px', objectFit: 'cover' }} 
                            />
                        </div>
                        
                        <h5 className="fw-bold text-center text-white mb-1">{selectedBookForModal.title}</h5>
                        <p className="text-muted text-center small mb-3">by {selectedBookForModal.author}</p>
                        
                        <div className="mb-3">
                            <label className="form-label small text-white-50">Reading Status</label>
                            <select 
                                className="form-select bg-dark text-white border-secondary"
                                value={modalStatus} 
                                onChange={(e) => setModalStatus(e.target.value)}
                            >
                                <option value="NOT_STARTED">Not Started</option>
                                <option value="WANT_TO_READ">Want to Read</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="PAUSED">Paused</option>
                            </select>
                        </div>
                        
                        <div className="mb-4">
                            <label className="form-label small text-white-50">Personal Notes</label>
                            <textarea 
                                className="form-control bg-dark text-white border-secondary" 
                                rows="4" 
                                placeholder="Add your thoughts or notes..." 
                                value={modalNotes} 
                                onChange={(e) => setModalNotes(e.target.value)}
                            />
                        </div>
                        
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setSelectedBookForModal(null)}>Cancel</button>
                            <button className="btn btn-primary rounded-pill px-3" onClick={() => { router.push(`/read-book/${selectedBookForModal.bookId}`); setSelectedBookForModal(null); }}>Read PDF</button>
                            <button className="btn btn-info rounded-pill px-3" onClick={() => { router.push(`/flipbook/${selectedBookForModal.bookId}`); setSelectedBookForModal(null); }}>Read Flipbook</button>
                            <button className="btn btn-warning rounded-pill px-4 fw-bold" style={{ backgroundColor: '#EAA451', borderColor: '#EAA451', color: '#000' }} onClick={handleSaveModal}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import ClientOnly from '../components/ClientOnly';
export default function VirtualBookshelf() {
  return <ClientOnly><VirtualBookshelfInner /></ClientOnly>;
}


