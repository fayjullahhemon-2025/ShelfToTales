'use client';

export const MenuListArray2 = [
    {
        title: 'Home',	
        to: '/',
    },
    {
        title: 'Shop',
        classsChange: 'sub-menu-down',
        content: [
            {
                title: 'All Books',
                to: '/books-grid-view-sidebar',
            },
            {
                title: 'New Arrivals',
                to: '/book-list',
            },
            {
                title: 'Best Sellers',
                to: '/shop-list',
            },
        ],
    },
    {
        title: 'Community',
        classsChange: 'sub-menu-down',
        content: [
            {
                title: 'Reader Network',
                to: '/reader-network',
            },
            {
                title: 'Reading Rooms',
                to: '/reading-room',
            },
            {
                title: 'Reading Dashboard',
                to: '/reading-dashboard',
            },
        ],
    },
    {
        title: 'My Bookshelf',
        to: '/virtual-bookshelf',
    },
    {
        title: 'Blog',
        to: '/blog-grid',
    },
    {
        title: 'About',
        classsChange: 'sub-menu-down',
        content: [
            {
                title: 'About Us',
                to: '/about-us',
            },
            {
                title: 'Contact Us',
                to: '/contact-us',
            },
            {
                title: "FAQ's",
                to: '/faq',
            },
            {
                title: 'Help Desk',
                to: '/help-desk',
            },
        ],
    },
]
