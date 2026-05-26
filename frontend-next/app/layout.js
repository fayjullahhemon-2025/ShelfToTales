import "bootstrap/dist/css/bootstrap.min.css";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/effect-fade";
import "./assets/css/style.css";
import "./globals.css";

import { AuthProvider } from "./contexts/AuthContext";
import { AppProvider } from "./contexts/AppContext";
import { CartProvider } from "./contexts/CartContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/layout/ScrollToTop";
import PageAnimationWrapper from "./components/layout/PageAnimationWrapper";

export const metadata = {
  title: "Shelf To Tales — Book Store",
  description: "Shelf To Tales — Book React Store Ecommerce Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome via CDN — matched the CRA app's <head> */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>
        <AuthProvider>
          <AppProvider>
            <CartProvider>
              <div className="App">
                <div className="page-wraper">
                  <Header />
                  <PageAnimationWrapper>
                    {children}
                  </PageAnimationWrapper>
                  <Footer footerChange="style-1" />
                </div>
                <ScrollToTop />
              </div>
            </CartProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
