import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Outlet } from 'react-router-dom';
import ScrollToTop2 from "react-scroll-to-top";

// Layouts (eagerly loaded — used on every page)
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ScrollToTop from '../components/layout/ScrollToTop';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Images (used by layout)
import logo from '../assets/images/logo.png';

// Pages (lazy-loaded — split into separate bundles)
const Home = lazy(() => import('../pages/Home/Home'));
const Home2 = lazy(() => import('../pages/Home/Home2'));
const AboutUs = lazy(() => import('../pages/Company/AboutUs'));
const MyProfile = lazy(() => import('../pages/Auth/MyProfile'));
const Services = lazy(() => import('../pages/Company/Services'));
const Faq = lazy(() => import('../pages/Company/Faq'));
const HelpDesk = lazy(() => import('../pages/Company/HelpDesk'));
const Pricing = lazy(() => import('../pages/Company/Pricing'));
const PrivacyPolicy = lazy(() => import('../pages/Company/PrivacyPolicy'));
const BooksGridView = lazy(() => import('../pages/Books/BooksGridView'));
const BookListPage = lazy(() => import('../pages/Books/BookListPage'));
const ShopList = lazy(() => import('../pages/Shop/ShopList'));
const BooksGridViewSidebar = lazy(() => import('../pages/Books/BooksGridViewSidebar'));
const BooksListViewSidebar = lazy(() => import('../pages/Books/BooksListViewSidebar'));
const ShopCart = lazy(() => import('../pages/Shop/ShopCart'));
const Wishlist = lazy(() => import('../pages/Shop/Wishlist'));
const Login = lazy(() => import('../pages/Auth/Login'));
const Registration = lazy(() => import('../pages/Auth/Registration'));
const ShopCheckout = lazy(() => import('../pages/Shop/ShopCheckout'));
const ShopDetail = lazy(() => import('../pages/Shop/ShopDetail'));
const BlogGrid = lazy(() => import('../pages/Blog/BlogGrid'));
const BlogLargeSidebar = lazy(() => import('../pages/Blog/BlogLargeSidebar'));
const BlogListSidebar = lazy(() => import('../pages/Blog/BlogListSidebar'));
const BlogDetail = lazy(() => import('../pages/Blog/BlogDetail'));
const ContactUs = lazy(() => import('../pages/Company/ContactUs'));
const ProductComparison = lazy(() => import('../pages/Shop/ProductComparison'));
const OrderDetail = lazy(() => import('../pages/Order/OrderDetail'));
const BlogManagement = lazy(() => import('../pages/Blog/BlogManagement'));
const ErrorPage = lazy(() => import('../pages/Misc/ErrorPage'));
const UnderConstruction = lazy(() => import('../pages/Misc/UnderConstruction'));
const ComingSoon = lazy(() => import('../pages/Misc/ComingSoon'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const PurchaseHistory = lazy(() => import('../pages/Order/PurchaseHistory'));
const VirtualBookshelf = lazy(() => import('../pages/Bookshelf/VirtualBookshelf'));
const FlipbookReader = lazy(() => import('../pages/Bookshelf/FlipbookReader'));
const ReaderNetwork = lazy(() => import('../pages/ReaderNetwork/ReaderNetwork'));
const ReadingDashboard = lazy(() => import('../pages/ReaderNetwork/ReadingDashboard'));
const ReadingRoom = lazy(() => import('../pages/ReaderNetwork/ReadingRoom'));

function AppRoutes(props){
	return(
		<ErrorBoundary>
			<BrowserRouter basename="/">
				<Suspense fallback={<LoadingSpinner />}>
					<Routes>
						<Route path='/error-404' element={<ErrorPage/>} />
						<Route path='/under-construction' element={<UnderConstruction/>} />
						<Route path='/coming-soon' element={<ComingSoon/>} />
						<Route path='/index-2' element={<Home2/>} />
						<Route  element={<MainLayout />} >
							<Route path='/' exact element={<Home />} />
							<Route path='/about-us' exact element={<AboutUs/>} />
							<Route path='/my-profile' exact element={<ProtectedRoute><MyProfile/></ProtectedRoute>} />
							<Route path='/services' exact element={<Services/>} />
							<Route path='/faq' exact element={<Faq/>} />
							<Route path='/help-desk' exact element={<HelpDesk/>} />
							<Route path='/pricing' exact element={<Pricing/>} />
							<Route path='/privacy-policy' exact element={<PrivacyPolicy/>} />
							<Route path='/books-grid-view' exact element={<BooksGridView/>} />
							<Route path='/books-list' exact element={<ShopList/>} />
							<Route path='/book-list' exact element={<BookListPage/>} />
							<Route path='/shop-list' exact element={<ShopList/>} />
							<Route path='/books-grid-view-sidebar' exact element={<BooksGridViewSidebar/>} />
							<Route path='/books-list-view-sidebar' exact element={<BooksListViewSidebar/>} />
							<Route path='/shop-cart' exact element={<ProtectedRoute><ShopCart/></ProtectedRoute>} />
							<Route path='/wishlist' exact element={<ProtectedRoute><Wishlist/></ProtectedRoute>} />
							<Route path='/shop-login' exact element={<Login/>} />
							<Route path='/shop-registration' exact element={<Registration/>} />
							<Route path='/shop-checkout' exact element={<ProtectedRoute><ShopCheckout/></ProtectedRoute>} />
							<Route path='/shop-detail/:id' exact element={<ShopDetail/>} />
							<Route path='/books-detail/:id' exact element={<ShopDetail/>} />
							<Route path='/blog-grid' exact element={<BlogGrid/>} />
							<Route path='/blog-large-sidebar' exact element={<BlogLargeSidebar/>} />
							<Route path='/blog-list-sidebar' exact element={<BlogListSidebar/>} />
							<Route path='/blog-detail' exact element={<BlogDetail/>} />
							<Route path='/dashboard' exact element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
							<Route path='/purchase-history' exact element={<ProtectedRoute><PurchaseHistory/></ProtectedRoute>} />
							<Route path='/virtual-bookshelf' exact element={<ProtectedRoute><VirtualBookshelf/></ProtectedRoute>} />
							<Route path='/read-book/:bookId' exact element={<ProtectedRoute><FlipbookReader/></ProtectedRoute>} />
							<Route path='/product-comparison' exact element={<ProductComparison/>} />
							<Route path='/order-detail/:id' exact element={<ProtectedRoute><OrderDetail/></ProtectedRoute>} />
							<Route path='/blog-management' exact element={<ProtectedRoute><BlogManagement/></ProtectedRoute>} />
							<Route path='/contact-us' exact element={<ContactUs/>} />
							<Route path='/reader-network' exact element={<ProtectedRoute><ReaderNetwork/></ProtectedRoute>} />
							<Route path='/reading-dashboard' exact element={<ProtectedRoute><ReadingDashboard/></ProtectedRoute>} />
							<Route path='/reading-room' exact element={<ProtectedRoute><ReadingRoom/></ProtectedRoute>} />
							<Route path='*' element={<ErrorPage/>} />
						</Route>
					</Routes>
				</Suspense>
				<ScrollToTop />
				<ScrollToTop2 className="styles_scroll-to-top__2A70v  fas fa-arrow-up scroltop" smooth />
			</BrowserRouter>
		</ErrorBoundary>
	)
}

function MainLayout(){

	return (
		<div className="page-wraper">
			<Header />
			<Outlet />
			<Footer  footerChange="style-1" logoImage={logo}/>
	  </div>
	)

  };
export default AppRoutes;
