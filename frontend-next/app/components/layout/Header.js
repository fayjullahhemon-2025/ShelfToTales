'use client';

import React,{useEffect, useState} from 'react';
import Link from 'next/link';
import {Dropdown} from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
//images
const logo = '/assets/images/logo.png';
import Collapse from 'react-bootstrap/Collapse';
import {MenuListArray2} from './MenuListArray2';

function Header(){
	const { user, isAuthenticated, logout } = useAuth();
	const { count: cartCount } = useCart();
	const [selectBtn, setSelectBtn] = useState('Category');
	const [active, setActive] = useState(null);
	const [headerFix, setheaderFix] = React.useState(false);

	const handleMenuActive = (title) => {
		setActive(active === title ? null : title);
	};
	useEffect(() => {
		const handleScroll = () => {
			setheaderFix(window.scrollY > 50);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []); 
	
	/* for open menu Toggle btn  */
	const [sidebarOpen, setSidebarOpen] = useState(false);	
	const showSidebar = () => setSidebarOpen(!sidebarOpen);
	/*  Toggle btn End  */
	
	return(
		
		<header className="site-header mo-left header style-1">	
			<div className="header-info-bar">
				<div className="container clearfix">
					{/* <!-- Website Logo --> */}
					<div className="logo-header logo-dark">
						<Link href={"/"}><img loading="lazy" decoding="async" src={logo} alt="logo" /></Link>
					</div>
					
					{/* <!-- EXTRA NAV --> */}
					<div className="extra-nav">
						<div className="extra-cell">
							<ul className="navbar-nav header-right">
								<li className="nav-item">
									<Link href={"/wishlist"} className="nav-link">
										<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>
										<span className="badge">Wishlist</span>
									</Link>
								</li>
								<li className="nav-item">
									<Link href={"/shop-cart"} className="nav-link">
										<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
										<span className="badge">Cart</span>
									</Link>
								</li>
								{isAuthenticated ? (
									<Dropdown as="li" className="nav-item dropdown profile-dropdown ms-4">
										<Dropdown.Toggle as="div" className="nav-link i-false" style={{cursor: 'pointer'}}>
											<img loading="lazy" decoding="async" src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'User')}&background=9cd2ef&color=fff&size=80`} alt="/" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} />
											<div className="profile-info">
												<h6 className="title">{user.fullName || user.email}</h6>
												<span>{user.email}</span>
											</div>
										</Dropdown.Toggle>
										<Dropdown.Menu className="dropdown-menu py-0 dropdown-menu-end">
											<div className="dropdown-header">
												<h6 className="m-0">{user.fullName || user.email}</h6>
												<span>{user.email}</span>
											</div>
											<div className="dropdown-body">
												<Link href={"/dashboard"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
													<div>
														<i className="fa-solid fa-gauge ms-1"></i>
														<span className="ms-2">Dashboard</span>
													</div>
												</Link>
												<Link href={"/my-profile"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
													<div>
														<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
														<span className="ms-2">Profile</span>
													</div>
												</Link>
												<Link href={"/shop-cart"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
													<div>
														<i className="fa-solid fa-cart-shopping ms-1"></i>
														<span className="ms-2">Cart</span>
													</div>
												</Link>
												<Link href={"/purchase-history"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
													<div>
														<i className="fa-solid fa-history ms-1"></i>
														<span className="ms-2">Purchase History</span>
													</div>
												</Link>
												<Link href={"/virtual-bookshelf"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
													<div>
														<i className="fa-solid fa-book ms-1"></i>
														<span className="ms-2">Virtual Bookshelf</span>
													</div>
												</Link>
												<Link href={"/product-comparison"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
													<div>
														<i className="fa-solid fa-code-compare ms-1"></i>
														<span className="ms-2">Product Comparison</span>
													</div>
												</Link>
												<Link href={"/blog-management"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
													<div>
														<i className="fa-solid fa-file-pen ms-1"></i>
														<span className="ms-2">Blog Management</span>
													</div>
												</Link>
												{user?.role === 'ADMIN' && (
													<>
														<Link href={"/admin/books"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
															<div>
																<i className="fa-solid fa-book-medical ms-1"></i>
																<span className="ms-2">Manage Books</span>
															</div>
														</Link>
														<Link href={"/admin/categories"} className="dropdown-item d-flex justify-content-between align-items-center ai-icon">
															<div>
																<i className="fa-solid fa-tags ms-1"></i>
																<span className="ms-2">Manage Categories</span>
															</div>
														</Link>
													</>
												)}
											</div>
											<div className="dropdown-footer">
												<Dropdown.Item as="button" onClick={logout} className="btn btn-primary w-100 btnhover btn-sm text-white">Log Out</Dropdown.Item>
											</div>
										</Dropdown.Menu>
									</Dropdown>
								) : (
									<li className="nav-item ms-4">
										<Link href={"/shop-login"} className="btn btn-primary btn-sm btnhover">Login</Link>
									</li>
								)}
							</ul>
						</div>
					</div>
					
					{/* <!-- header search nav --> */}
					<div className="header-search-nav">
						<form className="header-item-search">
							<div className="input-group search-input">								
								<Dropdown className="dropdown bootstrap-select default-select drop-head">
									<Dropdown.Toggle  as="div" className="i-false">{selectBtn} 										
									 	<i className="ms-4 font-10 fa-solid fa-chevron-down"></i>
									</Dropdown.Toggle>
									<Dropdown.Menu>
										<Dropdown.Item onClick={()=>setSelectBtn('Category')}>Category</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Photography')}>Photography</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Arts')}>Arts</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Adventure')}>Adventure</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Action')}>Action</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Games')}>Games</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Movies')}>Movies</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Comics')}>Comics</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Biographies')}>Biographies</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Children’s Books')}>Children’s Books</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Historical')}>Historical</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Contemporary')}>Contemporary</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Classics')}>Classics</Dropdown.Item>
										<Dropdown.Item onClick={()=>setSelectBtn('Education')}>Education</Dropdown.Item>
									</Dropdown.Menu>
								</Dropdown>
								<input type="text" className="form-control" aria-label="Text input with dropdown button" placeholder="Search Books Here" />
								<button className="btn" type="button"><i className="flaticon-loupe"></i></button>
							</div>
						</form>
					</div>
				</div>
			</div>
			<div className={`sticky-header main-bar-wraper navbar-expand-lg ${headerFix ? "is-fixed" : ""}`}>
				<div className="main-bar clearfix">
					<div className="container clearfix">
						{/* <!-- Website Logo --> */}
						<div className="logo-header logo-dark">
							<Link href={"#"}><img loading="lazy" decoding="async" src={logo} alt="logo" /></Link>
						</div>
						
						{/* <!-- Nav Toggle Button --> */}
						<button className={`navbar-toggler collapsed navicon justify-content-end ${sidebarOpen ? 'open' : '' }`} onClick={showSidebar} >
							<span></span>
							<span></span>
							<span></span>
						</button>
						
						{/* <!-- EXTRA NAV --> */}
						<div className="extra-nav">
							<div className="extra-cell">
								{isAuthenticated ? (
									<Link href={"/reading-room"} className="btn btn-primary btnhover">Start Reading</Link>
								) : (
									<Link href={"/shop-registration"} className="btn btn-primary btnhover">Join Community</Link>
								)}
							</div>
						</div>
						
						{/* <!-- Main Nav --> */}
						<div className= {`header-nav navbar-collapse collapse justify-content-start ${sidebarOpen ? 'show' : ''}`} id="navbarNavDropdown">
							<div className="logo-header logo-dark">
								<Link href={"#"}><img loading="lazy" decoding="async" src={logo} alt="" /></Link>
							</div>
							<form className="search-input">
								<div className="input-group">
									<input type="text" className="form-control" aria-label="Text input with dropdown button" placeholder="Search Books Here" />
									<button className="btn" type="button"><i className="flaticon-loupe"></i></button>
								</div>
							</form>
							<ul className="nav navbar-nav">
								{MenuListArray2.map((data,index) => {										
									return(
											<li  key={index} 
												className={`${ (active === data.title) && (data.content) ? 'sub-menu-down open' : data.content ?  'sub-menu-down' : '' } `}
											>
											<Link href={data.content ?  "#" : data.to} 
												onClick={() => handleMenuActive(data.title)}
											>
												<span>{data.title}</span>
											</Link>
											{data.content &&
												<Collapse in={active === data.title ? true :false}>
													<ul  className="sub-menu">
														{data.content && data.content.map((data,index) => {
														 return(
															<li key={index}><Link href={data.to}>{data.title}</Link></li>
														 )
														 })}
													</ul>
												</Collapse>
											}
										</li>
									)
								})}
							</ul>
							<div className="dz-social-icon">
								<ul>
									<li><a className="fab fa-facebook-f" target="_blank" rel="noreferrer" href="https://www.facebook.com/dexignzone" aria-label="Facebook"></a></li>
									<li><a className="fab fa-twitter" target="_blank" rel="noreferrer" href="https://twitter.com/dexignzones" aria-label="Twitter"></a></li>
									<li><a className="fab fa-linkedin-in" target="_blank" rel="noreferrer" href="https://www.linkedin.com/showcase/3686700/admin/" aria-label="LinkedIn"></a></li>
									<li><a className="fab fa-instagram" target="_blank" rel="noreferrer" href="https://www.instagram.com/website_templates__/" aria-label="Instagram"></a></li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>	
	)
} 
export default Header;


