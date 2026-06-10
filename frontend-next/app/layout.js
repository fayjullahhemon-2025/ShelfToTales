import "bootstrap/dist/css/bootstrap.min.css";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "./assets/css/style.css";
import "./globals.css";
import "./styles/ui-foundation.css";
import "./styles/shop-enhanced.css";

import { Playfair_Display, DM_Sans } from "next/font/google";
import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { CartProvider } from "./contexts/CartContext";
import { LofiProvider } from "./contexts/LofiContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";
import PageAnimationWrapper from "./components/layout/PageAnimationWrapper";
import RouteAnimator from "./components/layout/RouteAnimator";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata = {
  title: {
    default: 'ShelfToTales — Community Bookstore',
    template: '%s | ShelfToTales',
  },
  description: 'Discover, read, and share books with a community of passionate readers.',
  keywords: ['books', 'reading', 'bookstore', 'community', 'reviews'],
  openGraph: {
    title: 'ShelfToTales',
    description: 'Discover books, read with purpose, and discuss with fellow book lovers.',
    type: 'website',
    url: 'https://shelftotales.com',
    siteName: 'ShelfToTales',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ShelfToTales — Bookstore & Reader Community',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShelfToTales',
    description: 'Discover books, read with purpose, and discuss with fellow book lovers.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={dmSans.className}>
        <AuthProvider>
          <AppProvider>
            <CartProvider>
              <LofiProvider>
                <div className="App">
                  <div className="page-wraper">
                    <Header />
                    <RouteAnimator>{children}</RouteAnimator>
                    <Footer footerChange="style-1" />
                  </div>
                  <ScrollToTop />
                </div>
              </LofiProvider>
            </CartProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
