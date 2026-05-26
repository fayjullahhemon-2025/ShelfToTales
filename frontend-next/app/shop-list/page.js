'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dropdown } from 'react-bootstrap';
import { bookService } from '../lib/api';

//Component
import NewsLetter from '../components/features/NewsLetter';
import { FadeIn } from '../components/common/AnimationUtils';

function ShopList(){
    const [books, setBooks] = useState([]);
    const [accordBtn, setAccordBtn] = useState();
    const [selectBtn, setSelectBtn] = useState('Newest');

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const response = await bookService.getAll();
                setBooks(response.data.content || response.data || []);
            } catch (error) {
                console.error('Error fetching books:', error);
            }
        };
        fetchBooks();
    }, []);

    return(
        <>
            <div className="page-content bg-grey">
                <FadeIn>
                <section className="content-inner-1 border-bottom">
                    <div className="container">
                        <div className="d-flex justify-content-between align-items-center">
                            <h4 className="title">Books</h4>
                        </div>
                        <div className="filter-area m-b30">
                            <div className="grid-area">
                                <div className="shop-tab">
                                    <ul className="nav text-center product-filter justify-content-end" role="tablist">
                                        <li className="nav-item">
                                            <Link href={"/books-list"} className="nav-link active" >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 5H21C21.2652 5 21.5196 4.89464 21.7071 4.7071C21.8946 4.51957 22 4.26521 22 4C22 3.73478 21.8946 3.48043 21.7071 3.29289C21.5196 3.10536 21.2652 3 21 3H3C2.73478 3 2.48043 3.10536 2.29289 3.29289C2.10536 3.48043 2 3.73478 2 4C2 4.26521 2.10536 4.51957 2.29289 4.7071C2.48043 4.89464 2.73478 5 3 5Z" fill="#AAAAAA"></path>
                                                <path d="M3 13H21C21.2652 13 21.5196 12.8947 21.7071 12.7071C21.8946 12.5196 22 12.2652 22 12C22 11.7348 21.8946 11.4804 21.7071 11.2929C21.5196 11.1054 21.2652 11 21 11H3C2.73478 11 2.48043 11.1054 2.29289 11.2929C2.10536 11.4804 2 11.7348 2 12C2 12.2652 2.10536 12.5196 2.29289 12.7071C2.48043 12.8947 2.73478 13 3 13Z" fill="#AAAAAA"></path>
                                                <path d="M3 21H21C21.2652 21 21.5196 20.8947 21.7071 20.7071C21.8946 20.5196 22 20.2652 22 20C22 19.7348 21.8946 19.4804 21.7071 19.2929C21.5196 19.1054 21.2652 19 21 19H3C2.73478 19 2.48043 19.1054 2.29289 19.2929C2.10536 19.4804 2 19.7348 2 20C2 20.2652 2.10536 20.5196 2.29289 20.7071C2.48043 20.8947 2.73478 21 3 21Z" fill="#AAAAAA"></path>
                                                </svg>
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link href={"/books-grid-view"} className="nav-link">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 11H10C10.2652 11 10.5196 10.8946 10.7071 10.7071C10.8946 10.5196 11 10.2652 11 10V3C11 2.73478 10.8946 2.48043 10.7071 2.29289C10.5196 2.10536 10.2652 2 10 2H3C2.73478 2 2.48043 2.10536 2.29289 2.29289C2.10536 2.48043 2 2.73478 2 3V10C2 10.2652 2.10536 10.5196 2.29289 10.7071C2.48043 10.8946 2.73478 11 3 11ZM4 4H9V9H4V4Z" fill="#AAAAAA"></path>
                                                <path d="M14 11H21C21.2652 11 21.5196 10.8946 21.7071 10.7071C21.8946 10.5196 22 10.2652 22 10V3C22 2.73478 21.8946 2.48043 21.7071 2.29289C21.5196 2.10536 21.2652 2 21 2H14C13.7348 2 13.4804 2.10536 13.2929 2.29289C13.1054 2.48043 13 2.73478 13 3V10C13 10.2652 13.1054 10.5196 13.2929 10.7071C13.4804 10.8946 13.7348 11 14 11ZM15 4H20V9H15V4Z" fill="#AAAAAA"></path>
                                                <path d="M3 22H10C10.2652 22 10.5196 21.8946 10.7071 21.7071C10.8946 21.5196 11 21.2652 11 21V14C11 13.7348 10.8946 13.4804 10.7071 13.2929C10.5196 13.1054 10.2652 13 10 13H3C2.73478 13 2.48043 13.1054 2.29289 13.2929C2.10536 13.4804 2 13.7348 2 14V21C2 21.2652 2.10536 21.5196 2.29289 21.7071C2.48043 21.8946 2.73478 22 3 22ZM4 15H9V20H4V15Z" fill="#AAAAAA"></path>
                                                <path d="M14 22H21C21.2652 22 21.5196 21.8946 21.7071 21.7071C21.8946 21.5196 22 21.2652 22 21V14C22 13.7348 21.8946 13.4804 21.7071 13.2929C21.5196 13.1054 21.2652 13 21 13H14C13.7348 13 13.4804 13.1054 13.2929 13.2929C13.1054 13.4804 13 13.7348 13 14V21C13 21.2652 13.1054 21.5196 13.2929 21.7071C13.4804 21.8946 13.7348 22 14 22ZM15 15H20V20H15V15Z" fill="#AAAAAA"></path>
                                                </svg>
                                            </Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link href={"/books-grid-view-sidebar"} className="nav-link">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M3 22H21C21.2652 22 21.5196 21.8946 21.7071 21.7071C21.8946 21.5196 22 21.2652 22 21V3C22 2.73478 21.8946 2.48043 21.7071 2.29289C21.5196 2.10536 21.2652 2 21 2H3C2.73478 2 2.48043 2.10536 2.29289 2.29289C2.10536 2.48043 2 2.73478 2 3V21C2 21.2652 2.10536 21.5196 2.29289 21.7071C2.48043 21.8946 2.73478 22 3 22ZM13 4H20V11H13V4ZM13 13H20V20H13V13ZM4 4H11V20H4V4Z" fill="#AAAAAA"></path>
                                                </svg>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="category">
                                <div className="filter-category">
                                    <Link href={"#"} data-bs-toggle="collapse"  
                                        onClick={() => setAccordBtn(!accordBtn)}
                                    >
                                        <i className="fas fa-list me-2"></i>
                                        Categories
                                    </Link>
                                </div>
                                <div className="form-group">
                                    <i className="fas fa-sort-amount-down me-2 text-secondary"></i>                                   
                                    <Dropdown>
                                        <Dropdown.Toggle  className="i-false">{selectBtn} <i className="ms-4 font-14 fa-solid fa-caret-down" /></Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={()=>setSelectBtn('Newest')}>Newest</Dropdown.Item>
                                            <Dropdown.Item onClick={()=>setSelectBtn('Oldest')}>Oldest</Dropdown.Item>
                                            <Dropdown.Item onClick={()=>setSelectBtn('Price Low')}>Price Low</Dropdown.Item>
                                            <Dropdown.Item onClick={()=>setSelectBtn('Price High')}>Price High</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </div>
                        </div>

                        <div className="row ">
                            {books.map((data, i)=>(                                
                                <div className="col-md-12 col-sm-12" key={i}>
                                    <div className="dz-shop-card style-2">
                                        <div className="dz-media">
                                            <img loading="lazy" decoding="async" src={data.imageUrl} alt="book" style={{width: '150px'}} />
                                        </div>
                                        <div className="dz-content">
                                            <div className="dz-header">
                                                <div>
                                                    <ul className="dz-tags">
                                                        <li><Link href={"#"}>{data.category?.name}</Link></li>
                                                    </ul>
                                                    <h4 className="title mb-0"><Link href={`/shop-detail/${data.id}`}>{data.title}</Link></h4>
                                                </div>
                                                <div className="price">
                                                    <span className="price-num text-primary">${data.discountPrice || data.price}</span>
                                                    {data.discountPrice && <del>${data.price}</del>}
                                                </div>
                                            </div>
                                            
                                            <div className="dz-body">
                                                <div className="dz-rating-box">
                                                    <div>
                                                        <p className="dz-para">{data.description}</p>
                                                    </div>
                                                    <div className="review-num">
                                                        <h4>4.0</h4>
                                                        <ul className="dz-rating">
                                                            <li><i className="flaticon-star text-yellow"></i></li>	
                                                            <li><i className="flaticon-star text-yellow"></i></li>	
                                                            <li><i className="flaticon-star text-yellow"></i></li>	
                                                            <li><i className="flaticon-star text-yellow"></i></li>		
                                                            <li><i className="flaticon-star text-muted"></i></li>		
                                                        </ul>
                                                    </div>
                                                </div>
                                                <div className="rate">
                                                    <ul className="book-info">
                                                        <li><span>Writen by</span>{data.author}</li>
                                                    </ul>
                                                    <div className="d-flex">
                                                        <Link href={`/shop-detail/${data.id}`} className="btn btn-secondary btnhover btnhover2">View Details</Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}   
                             
                        </div>
                    </div>
                </section>
                </FadeIn>
                <NewsLetter />      
            </div>
        </>
    )
}
export default ShopList;

