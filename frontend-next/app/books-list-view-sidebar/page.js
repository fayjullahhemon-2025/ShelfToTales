'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React,{useState} from 'react';
import Link from 'next/link';
import {Collapse, Dropdown} from 'react-bootstrap';

//Component
import ClientsSlider from '../components/features/Home/ClientsSlider';
import NewsLetter from '../components/features/NewsLetter';

//element
import CounterSection from '../components/common/CounterSection';
import ShopSidebar from '../components/common/ShopSidebar';
import { FadeIn } from '../components/common/AnimationUtils';

//Images
const book16 = '/assets/images/books/grid/book16.jpg';
const book12 = '/assets/images/books/grid/book12.jpg';
const book14 = '/assets/images/books/grid/book14.jpg';
const book15 = '/assets/images/books/grid/book15.jpg';
const book10 = '/assets/images/books/grid/book10.jpg';
const book11 = '/assets/images/books/grid/book11.jpg';
const lableBlogData = [
    {name:'Architecture'},
    {name:'Art'},
    {name:'Action'},
    {name:'Biography & Autobiography'},
    {name:'Body, Mind & Spirit'},
    {name:'Business & Economics'},    
    {name:'Children Fiction'},
    {name:'Children Non-Fiction'},
    {name:'Comics & Graphic Novels'},
    {name:'Cooking'},
    {name:'Crafts & Hobbies'},
    {name:'Design'},
    {name:'Drama'},
    {name:'Education'},
    {name:'Family & Relationships'},
    {name:'Fiction'},
    {name:'Foreign Language Study'},
    {name:'Games'},
    {name:'Gardening'},
    {name:'Health & Fitness'},
    {name:'History'},
    {name:'House & Home'},
    {name:'Humor'},
    {name:'Literary Collections'},
    {name:'Mathematics'}
];

const cardDetials = [
    {image:book12, title:'The Missadventure of David', subtitle1:'DRAMA',subtitle2:'HORROR', price1:'23.00', price2:'52.00' },
    {image:book16, title:'Thunder Stunt', subtitle1:'ADVANTURE',subtitle2:'SCIENCE', price1:'54.78', price2:'70.00' },
    {image:book14, title:'A Heavy Lift', subtitle1:'RACING',subtitle2:'DRAMA', price1:'25.18', price2:'68.00' },
    {image:book15, title:'Terrible Madness', subtitle1:'SPORTS',subtitle2:'GAME', price1:'25.30', price2:'38.00' },
    {image:book11, title:'ALL GOOD NEWS', subtitle1:'DRAMA',subtitle2:'COMEDY', price1:'40.78', price2:'68.00' },
    {image:book10, title:'Emily The Back', subtitle1:'DRAMA',subtitle2:'SIRIAL', price1:'54.78', price2:'63.00' }, 
 ];



function BooksListViewSidebar(){
    const [accordBtn, setAccordBtn] = useState();
    const [selectBtn, setSelectBtn] = useState('Newest');
    return(
        <>
            <div className="page-content bg-grey">
                <FadeIn>
                <div className="content-inner-1 border-bottom">
                    <div className="container">
                        <div className="row ">  
                            <div className="col-xl-3">
                                <ShopSidebar />
                            </div>
                           
                            <div className="col-xl-9">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="title">Books</h4>
                                    <Link href={"#"} className="btn btn-primary panel-btn">Filter</Link>
                                </div>
                                <div className="filter-area m-b30">
                                    <div className="grid-area">
                                        <div className="shop-tab">
                                            <ul className="nav text-center product-filter justify-content-end" role="tablist">
                                                <li className="nav-item">
                                                    <Link href={"/books-list"} className="nav-link" >
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
                                                    <Dropdown.Item onClick={()=>setSelectBtn('1 Days')}>1 Days</Dropdown.Item>
                                                    <Dropdown.Item onClick={()=>setSelectBtn('2 Week')}>2 Week</Dropdown.Item>
                                                    <Dropdown.Item onClick={()=>setSelectBtn('3 Week')}>3 Weeks</Dropdown.Item>
                                                    <Dropdown.Item onClick={()=>setSelectBtn('1 Month')}>1 Month</Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>
                                    </div>
                                </div>
                                <Collapse in={accordBtn} className="acod-content">
                                    <div>
                                        <div className="widget widget_services style-2">
                                            {lableBlogData.map((item, ind)=>(
                                                <div className="form-check search-content" key={ind}>
                                                    <input className="form-check-input" type="checkbox" value="" id={`productCheckBox${ind+1}`} /> 
                                                    <label className="form-check-label" htmlFor={`productCheckBox${ind+1}`}>
                                                        {item.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>   
                                    </div>
                                </Collapse>                               
                                {cardDetials.map((data, i)=>(         
                                    <div className="dz-shop-card style-2">
                                        <div className="dz-media">
                                            <img loading="lazy" decoding="async" src={data.image} alt="book" />									
                                        </div>
                                        <div className="dz-content">
                                            <div className="dz-header">
                                                <div>
                                                    <ul className="dz-tags">
                                                       <li><Link href={"#"}>{data.subtitle1},</Link></li>
                                                        <li><Link href={"#"}>{data.subtitle2},</Link></li>
                                                        <li><Link href={"#"}>COMEDY</Link></li>
                                                    </ul>
                                                    <h4 className="title mb-0"><Link href={"books-list-view-sidebar"}>{data.title}</Link></h4>
                                                </div>
                                                <div className="price">
                                                    <span className="price-num text-primary">${data.price1}</span>
                                                    <del>${data.price2}</del>
                                                </div>
                                            </div>
                                            
                                            <div className="dz-body">
                                                <div className="dz-rating-box">
                                                    <div>
                                                        <p className="dz-para">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type. </p>
                                                        <div>
                                                            <Link href={"/pricing"} className="badge me-1">Get 20% Discount for today</Link>
                                                            <Link href={"/pricing"} className="badge me-1">50% OFF Discount</Link>
                                                            <Link href={"/pricing"} className="badge next-badge">See 2+ promos</Link>
                                                        </div>
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
                                                        <span><Link href={"#"}> 235 Reviews</Link></span>
                                                    </div>
                                                </div>
                                                <div className="rate">
                                                    <ul className="book-info">
                                                        <li><span>Writen by</span>Kevin Smiley</li>
                                                        <li><span>Publisher</span>Printarea Studios</li>
                                                        <li><span>Year</span>2019</li>
                                                    </ul>
                                                    <div className="d-flex">
                                                        <Link href={"/shop-cart"} className="btn btn-secondary btnhover btnhover2"><i className="flaticon-shopping-cart-1 m-r10"></i> Add to cart</Link>
                                                        <div className="bookmark-btn style-1">
                                                            <input className="form-check-input" type="checkbox" id="flexCheckDefault1" />
                                                            <label className="form-check-label" for="flexCheckDefault1">
                                                                <i className="flaticon-heart"></i>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>                                   
                                ))}   
                                
                                <div className="row page">
                                    <div className="col-md-6">
                                        <p className="page-text">Showing 12 from 50 data</p>
                                    </div>
                                    <div className="col-md-6">
                                        <nav aria-label="Blog Pagination">
                                            <ul className="pagination style-1 p-t20">
                                                <li className="page-item"><Link href={"#"} className="page-link prev" >Prev</Link></li>
                                                <li className="page-item"><Link href={"#"} className="page-link active" >1</Link></li>
                                                <li className="page-item"><Link href={"#"} className="page-link">2</Link></li>
                                                <li className="page-item"><Link href={"#"} className="page-link">3</Link></li>
                                                <li className="page-item"><Link href={"#"} className="page-link next" >Next</Link></li>
                                            </ul>
                                        </nav>
                                    </div>
                                </div>
					        </div>
                        </div>
                    </div>    
                </div>            
                <div className="bg-white py-5">
			        <div className="container">              
                        <ClientsSlider />            
                    </div>    
                </div>                
                <section className="content-inner">
                    <div className="container">
                        <div className="row sp15">
                            <CounterSection />      
                        </div>   
                    </div>
                </section>
                </FadeIn>
                <NewsLetter />      
            </div>
        </>
    )
}
export default BooksListViewSidebar;

