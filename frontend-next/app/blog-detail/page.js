'use client';

// Force fully-dynamic rendering — page reads localStorage/window at render time.
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';

import PageTitle from '../components/layout/PageTitle';
import { FadeIn } from '../components/common/AnimationUtils';
//import BlogSidebar from '../components/common/BlogSidebar';
const profile4 = '/assets/images/profile4.jpg';
const profile3 = '/assets/images/profile3.jpg';
const profile2 = '/assets/images/profile2.jpg';
const profile1 = '/assets/images/profile1.jpg';
const blog1 = '/assets/images/blog/default/blog1.jpg';
const blog4 = '/assets/images/blog/large/blog4.jpg';
const blog = '/assets/images/blog/blog.jpg';const recent1 = '/assets/images/blog/recent-blog/blog1.jpg';
const recent2 = '/assets/images/blog/recent-blog/blog2.jpg';
const recent3 = '/assets/images/blog/recent-blog/blog3.jpg';
const postBlog = [
    {image: recent1, title:'The Miracle Of Library In Mind.'},
    {image: recent2, title:'Fall In Love With The Library'},
    {image: recent3, title:'So many books, so little time.'},
    {image: recent1, title:'Omg! The Best Library Ever!'},
];

const cardBlog = [
    {image:blog1, title:'How Library Can Increase Your Profit!'},
    {image:blog4, title:'Library Can Improve Your Business'},
];

function CommentBlog({title, image}){
    return(
        <>
            <div className="comment-body" id="div-comment-3">
                <div className="comment-author vcard">
                    <img loading="lazy" decoding="async" src={image} alt="" className="avatar"/>
                    <cite className="fn">{title}</cite> <span className="says">says:</span>
                    <div className="comment-meta">
                        <Link href={"#"}>December 28, 2022 at 6:14 am</Link>
                    </div>
                </div>
                <div className="comment-content dlab-page-text">
                    <p>Donec suscipit porta lorem eget condimentum. Morbi vitae mauris in leo venenatis varius. Aliquam nunc enim, egestas ac dui in, aliquam vulputate erat.</p>
                </div>
                <div className="reply">
                    <Link href={"#"} className="comment-reply-link"><i className="fa fa-reply"></i> Reply</Link>
                </div>
            </div>
        </>
    )
}

const BlogDetail = () =>{
    return(
        <>
            <PageTitle parentPage="Blog" childPage="Blog Details" />
                <FadeIn>
            <section className="content-inner-1 bg-img-fix">
				<div className="container">
					<div className="row">
                        <div className="col-xl-8 col-lg-8">
                            {/* <!-- blog start --> */}
                            <div className="dz-blog blog-single style-1">
                                <div className="dz-media rounded-md">
                                    <img loading="lazy" decoding="async" src={blog1} alt="" />
                                </div>
                                <div className="dz-info">
                                    <div className="dz-meta  border-0 py-0 mb-2">
                                        <ul className="border-0 pt-0">
                                            <li className="post-date"><i className="far fa-calendar fa-fw m-r10"></i>7 March, 2022</li>
                                            <li className="post-author"><i className="far fa-user fa-fw m-r10"></i>By <Link href={"#"}> Johne Doe</Link></li>
                                        </ul>
                                    </div>
                                    <h4 className="dz-title">The Time Is Running Out! Think About These 6 Ways To Change Your Library. How To Restore Library?</h4>
                                    <div className="dz-post-text">
                                        <p>Sed auctor magna lacus, in placerat nisl sollicitudin ut. Morbi feugiat ante velit, eget convallis arcu iaculis vel. Fusce in rhoncus quam. Integer dolor arcu, ullamcorper sed auctor vitae, porttitor quis erat. Donec sit amet semper massa.</p>
                                        <p>Ut non nisl et magna molestie tincidunt. Aliquam erat volutpat. Vivamus eget feugiat odio. Vivamus faucibus lorem nec mollis placerat. Nulla et dapibus est. Fusce porttitor arcu ac velit commodo hendrerit. Vestibulum tempor dapibus sapien. Maecenas accumsan rhoncus massa, nec ornare libero faucibus tincidunt. Cras metus tortor, pretium vitae scelerisque id, sollicitudin at est.</p>
                                        <blockquote className="wp-block-quote is-style-default"><p>A great book should leave you with many experiences, and slightly exhausted at the end. You live several lives while reading. </p><cite>Library Community</cite></blockquote>
                                        <p>Fusce sem ligula, imperdiet sed nisi sit amet, euismod posuere dolor. Vestibulum in ante ut tortor eleifend venenatis. Morbi ac hendrerit nisl. Sed auctor magna lacus, in placerat nisl sollicitudin ut. Morbi feugiat ante velit, eget convallis arcu iaculis vel. Fusce in rhoncus quam. Integer dolor arcu, ullamcorper sed auctor vitae, porttitor quis erat. </p>
                                        <h4 className="m-b30">Understanding The Background Of Library.</h4>
                                        <img loading="lazy" decoding="async" className="alignleft rounded-md w-50" src={blog} alt="" />
                                        <p>Pellentesque quis molestie lacus. Sed et pellentesque nibh. Pellentesque pretium pretium neque, vel fermentum nisl ornare non. Aliquam interdum rutrum magna quis.</p>
                                        <p>Donec pretium, quam a aliquet pretium, dolor magna malesuada libero, non rhoncus quam lectus at lectus. Mauris id consequat est, ut aliquet lorem. Maecenas mi sem, aliquam et semper et, sagittis non magna. Vivamus et maximus nulla. Morbi tincidunt ex ac diam imperdiet, ut pretium justo porttitor. Class aptent taciti sociosqu ad litora</p>
                                        <p>Donec suscipit porta lorem eget condimentum. Morbi vitae mauris in leo venenatis varius. Aliquam nunc enim, egestas ac dui in, aliquam vulputate erat. Curabitur porttitor ante ut odio vestibulum, et iaculis arcu scelerisque. Sed ornare mi vitae elit molestie malesuada. Curabitur venenatis venenatis elementum.</p>
                                    </div>
                                    <div className="dz-meta meta-bottom border-top">
                                        <div className="post-tags">
                                            <strong>Tags:</strong>
                                            <Link href={"#"}>Child</Link>,
                                            <Link href={"#"}>Education</Link>,
                                            <Link href={"#"}>Money</Link>,
                                            <Link href={"#"}>Adventure</Link>
                                        </div>
                                        <div className="dz-social-icon primary-light">
                                            <ul>
                                                <li><Link href={"#"} className="fab fa-facebook-f"></Link></li>
                                                <li><Link href={"#"} className="fab fa-instagram"></Link></li>
                                                <li><Link href={"#"} className="fab fa-twitter"></Link></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="row extra-blog style-1">
                                <div className="col-lg-12">
                                    <h4 className="blog-title">RELATED BLOGS</h4>
                                </div>
                                {cardBlog.map((data, ind)=>(
                                    <div className="col-lg-6 col-md-6" key={ind}>
                                        <div className="dz-blog style-1 bg-white m-b30">
                                            <div className="dz-media">
                                                <Link href={"/blog-detail"}><img loading="lazy" decoding="async" src={data.image} alt="" /></Link>
                                            </div>
                                            <div className="dz-info">
                                                <h5 className="dz-title">
                                                    <Link href={"/blog-detail"}>{data.title}</Link>
                                                </h5>
                                                <p className="m-b0">Pellentesque vel nibh gravida erat interdum lacinia vel in lectus. Sed fermentum  pulvinar.</p>
                                                <div className="dz-meta meta-bottom">
                                                    <ul className="">
                                                        <li className="post-date"><i className="far fa-calendar fa-fw m-r10"></i>7 March, 2022</li>
                                                        <li className="post-author"><i className="far fa-user fa-fw m-r10"></i>By <Link href={"#"}> Johne Doe</Link></li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}                                
                            </div>
                            <div className="clear" id="comment-list">
                                <div className="post-comments comments-area style-1 clearfix">
                                    <h4 className="comments-title">4 COMMENTS</h4>
                                    <div id="comment">
                                        <ol className="comment-list">
                                            <li className="comment even thread-even depth-1 comment" id="comment-2">
                                                <CommentBlog  title="Michel Poe"  image={profile4} /> 
                                                <ol className="children">
                                                    <li className="comment byuser comment-author-w3itexpertsuser bypostauthor odd alt depth-2 comment" id="comment-3">
                                                        <CommentBlog  title="Celesto Anderson"  image={profile3} /> 
                                                    </li>
                                                </ol>
                                            </li>
                                            <li className="comment even thread-odd thread-alt depth-1 comment" id="comment-4">
                                                <CommentBlog  title="Ryan"  image={profile2} />
                                            </li>
                                            <li className="comment odd alt thread-even depth-1 comment" id="comment-5">
                                                <CommentBlog  title="Stuart"  image={profile1} />
                                            </li>
                                        </ol>
                                    </div>
                                    <div className="default-form comment-respond style-1" id="respond">
                                        <h4 className="comment-reply-title" id="reply-title">LEAVE A REPLY 
                                            <small> 
                                                <Link href={"#"} rel="nofollow" id="cancel-comment-reply-link" style={{display:"none"}}>Cancel reply</Link> 
                                            </small>
                                        </h4>
                                        <div className="clearfix">
                                            <form method="post" id="comments_form" className="comment-form" novalidate>
                                                <p className="comment-form-author"><input id="name" placeholder="Author" name="author" type="text" value="" /></p>
                                                <p className="comment-form-email">
                                                    <input id="email" required="required" placeholder="Email" name="email" type="email" value="" />
                                                </p>
                                                <p className="comment-form-comment">
                                                    <textarea id="comments" placeholder="Type Comment Here" className="form-control4" name="comment" cols="45" rows="3" required="required"></textarea>
                                                </p>
                                                <p className="col-md-12 col-sm-12 col-xs-12 form-submit">
                                                    <button id="submit" type="submit" className="submit btn btn-primary filled">
                                                    Submit Now <i className="fa fa-angle-right m-l10"></i>
                                                    </button>
                                                </p>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* <!-- blog END --> */}
                        </div>
                        <div className="col-xl-4 col-lg-4">
                            <aside className="side-bar sticky-top mt-lg-0 mt-md-5">
                                <div className="widget">
                                    <div className="search-bx">
                                        <form role="search" method="post">
                                            <div className="input-group">
                                                <input name="text" className="form-control" placeholder="Search" type="text" />
                                                <span className="input-group-btn">
                                                    <button type="submit" className="btn btn-primary"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button>
                                                </span> 
                                            </div>
                                        </form>
                                    </div>
                                </div>
                                <div className="widget widget_categories">
                                    <h4 className="widget-title">Category</h4>
                                    <ul>
                                        <li className="cat-item cat-item-26"><Link href={"/blog-list-sidebar"}>Audio</Link>(3)</li>   
                                        <li className="cat-item cat-item-36"><Link href={"/blog-list-sidebar"}>Beauty</Link>(4)</li>
                                        <li className="cat-item cat-item-43"><Link href={"/blog-list-sidebar"}>Fashion</Link>(3)</li>
                                        <li className="cat-item cat-item-27"><Link href={"/blog-list-sidebar"}>Images</Link>(1)</li>
                                        <li className="cat-item cat-item-40"><Link href={"/blog-list-sidebar"}>Lifestyle</Link>(3)</li> 
                                    </ul>
                                </div>
                                <div className="widget recent-posts-entry">
                                    <h4 className="widget-title">Recent Posts</h4>
                                    <div className="widget-post-bx">
                                        {postBlog.map((data, index)=>(
                                            <div className="widget-post clearfix">
                                                <div className="dz-media"> 
                                                    <Link href={"/blog-detail"}><img loading="lazy" decoding="async" src={data.image} alt="" /></Link>
                                                </div>
                                                <div className="dz-info">
                                                    <h6 className="title"><Link href={"/blog-detail"}>{data.title}</Link></h6>
                                                    <div className="dz-meta">
                                                        <ul>
                                                            <li className="post-date"> 7 March, 2022 </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                    </div>
                                </div>
                                <div className="widget widget widget_categories">
                                    <h4 className="widget-title">Archives</h4>
                                    <ul>
                                        <li><Link href={"#"}>January</Link>(3)</li>
                                        <li><Link href={"#"}>Fabruary</Link>(4)</li>
                                        <li><Link href={"#"}>March</Link>(4)</li>
                                        <li><Link href={"#"}>April</Link>(3)</li>
                                        <li><Link href={"#"}>May</Link>(4)</li>
                                        <li><Link href={"#"}>Jun</Link>(1)</li>
                                        <li><Link href={"#"}>July</Link>(4)</li>
                                    </ul>
                                </div>
                                <div className="widget widget_tag_cloud">
                                    <h4 className="widget-title">Tags</h4>
                                    <div className="tagcloud"> 
                                        <Link href="#">Business</Link>
                                        <Link href="#">News</Link>
                                        <Link href="#">Brand</Link>
                                        <Link href="#">Website</Link>
                                        <Link href="#">Internal</Link>
                                        <Link href="#">Strategy</Link>
                                        <Link href="#">Brand</Link>
                                        <Link href="#">Mission</Link>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </section>    
                </FadeIn>

        </>
    )
}
export default BlogDetail;

