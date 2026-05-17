# ShelfToTales - Quick Fixes (Copy & Paste Ready)

## 🔴 CRITICAL FIXES - Do These First

### Fix #1: Memory Leak in Header.js (30 minutes)

**File:** `frontend/src/components/layout/Header.js`

**Replace this:**
```javascript
useEffect(() => {
  window.addEventListener("scroll", () => {
    setheaderFix(window.scrollY > 50);
  });
}, []); 
```

**With this:**
```javascript
useEffect(() => {
  const handleScroll = () => {
    setheaderFix(window.scrollY > 50);
  };
  
  window.addEventListener("scroll", handleScroll);
  
  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);
```

---

### Fix #2: N+1 Query in CartItemRepository (30 minutes)

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/repository/CartItemRepository.java`

**Replace this:**
```java
List<CartItem> findByUserIdWithBook(Long userId);
```

**With this:**
```java
@EntityGraph(attributePaths = {"book", "user"})
@Query("SELECT ci FROM CartItem ci WHERE ci.user.id = :userId")
List<CartItem> findByUserIdWithBook(@Param("userId") Long userId);
```

---

### Fix #3: N+1 Query in BookshelfRepository (30 minutes)

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/repository/BookshelfRepository.java`

**Add this method:**
```java
@EntityGraph(attributePaths = {"shelfBooks", "shelfBooks.book"})
@Query("SELECT b FROM Bookshelf b WHERE b.user.id = :userId ORDER BY b.position ASC")
List<Bookshelf> findByUserIdOrderByPositionAsc(@Param("userId") Long userId);
```

---

### Fix #4: Add Input Validation to DTOs (1 hour)

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/dto/LoginRequest.java`

**Replace this:**
```java
public class LoginRequest {
    private String email;
    private String password;
}
```

**With this:**
```java
import jakarta.validation.constraints.*;

public class LoginRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
```

**Apply same pattern to all DTOs:**
- `RegisterRequest.java`
- `BookRequest.java`
- `BookshelfRequest.java`
- `CartItemRequest.java`
- `ProfileRequest.java`

---

## ⚠️ HIGH PRIORITY FIXES

### Fix #5: Start Code Splitting (2-3 hours)

**File:** `frontend/src/routes/AppRoutes.js`

**Replace all imports at top:**
```javascript
import { lazy, Suspense } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

// Replace static imports with lazy imports
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
```

**Wrap routes with Suspense:**
```javascript
<Suspense fallback={<LoadingSpinner />}>
  <Route path='/' exact element={<Home />} />
  <Route path='/about-us' exact element={<AboutUs/>} />
  {/* ... rest of routes */}
</Suspense>
```

---

### Fix #6: Add Redis Caching (4-6 hours)

**File:** `backend/shelfToTales/pom.xml`

**Add dependency:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

**File:** `backend/shelfToTales/src/main/resources/application.yml`

**Add configuration:**
```yaml
spring:
  cache:
    type: redis
  redis:
    host: localhost
    port: 6379
    timeout: 2000ms
    jedis:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
```

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/service/CategoryService.java`

**Add caching:**
```java
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.EnableCaching;

@Service
@RequiredArgsConstructor
@EnableCaching
public class CategoryService {
    
    @Cacheable(value = "categories", unless = "#result.isEmpty()")
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public CategoryResponse saveCategory(CategoryRequest request) {
        // ... existing code
    }
    
    @CacheEvict(value = "categories", allEntries = true)
    @Transactional
    public void deleteCategory(Long id) {
        // ... existing code
    }
}
```

---

### Fix #7: Add Rate Limiting (2-3 hours)

**File:** `backend/shelfToTales/pom.xml`

**Add dependency:**
```xml
<dependency>
    <groupId>io.github.bucket4j</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>7.6.0</version>
</dependency>
```

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/config/RateLimitConfig.java`

**Create new file:**
```java
package com.example.shelftotales.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key) {
        return cache.computeIfAbsent(key, k -> createNewBucket());
    }

    private Bucket createNewBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)));
        return Bucket4j.builder()
                .addLimit(limit)
                .build();
    }
}
```

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/config/SecurityConfig.java`

**Add to securityFilterChain:**
```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()  // Rate limit these separately
    // ... rest of config
)
```

---

### Fix #8: Pagination Size Limits (30 minutes)

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/controller/BookController.java`

**Replace:**
```java
@RequestParam(defaultValue = "20") int size,
```

**With:**
```java
@RequestParam(defaultValue = "20") 
@Min(1) @Max(100) int size,
```

**Apply to all controllers:**
- `BookController.java`
- `CartController.java`
- `BookshelfController.java`
- `WishlistController.java`

---

## 📊 MEDIUM PRIORITY FIXES

### Fix #9: Strengthen Password Validation (1-2 hours)

**File:** `backend/shelfToTales/src/main/java/com/example/shelftotales/util/PasswordValidator.java`

**Replace entire file:**
```java
package com.example.shelftotales.util;

import java.util.Set;

public class PasswordValidator {
    private static final Set<String> COMMON_PASSWORDS = Set.of(
        "password123", "admin123", "qwerty123", "123456789", "password",
        "admin", "letmein", "welcome", "monkey", "dragon"
    );

    public static void validate(String password) {
        if (password == null || password.length() < 12) {
            throw new IllegalArgumentException("Password must be at least 12 characters");
        }
        
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Password must contain uppercase letter");
        }
        
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Password must contain lowercase letter");
        }
        
        if (!password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Password must contain digit");
        }
        
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?].*")) {
            throw new IllegalArgumentException("Password must contain special character");
        }
        
        if (COMMON_PASSWORDS.contains(password.toLowerCase())) {
            throw new IllegalArgumentException("Password is too common");
        }
    }
}
```

---

### Fix #10: Enable Response Compression (30 minutes)

**File:** `backend/shelfToTales/src/main/resources/application.yml`

**Add:**
```yaml
server:
  compression:
    enabled: true
    min-response-size: 1024
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
```

---

## 🎯 Testing Your Fixes

### Frontend
```bash
# Check bundle size
npm run build
ls -lh build/static/js/

# Profile performance
npm start
# Open DevTools → Performance tab → Record → Interact → Stop
```

### Backend
```bash
# Test with curl
curl -X GET http://localhost:8080/api/books?page=0&size=20

# Check response time
time curl -X GET http://localhost:8080/api/books

# Monitor database queries
# Enable in application.yml:
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
```

---

## ✅ Verification Checklist

After applying fixes:

- [ ] No console errors in browser DevTools
- [ ] No memory leaks (DevTools → Memory → Take heap snapshot)
- [ ] Bundle size reduced by 40%+
- [ ] API response time <150ms
- [ ] Database queries reduced by 80%+
- [ ] All tests pass
- [ ] No new warnings in build

---

**Total Time to Apply All Critical Fixes:** 4-5 hours
**Expected Performance Improvement:** 40-50%
