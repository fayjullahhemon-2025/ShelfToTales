# ShelfToTales Architecture Audit

**Date**: 2026-05-18  
**Scope**: Backend entities, repositories, DTOs, services, migrations, and frontend integration

---

## 1. ENTITIES & DATA MODEL

### Core Entities

#### Book
- **Location**: `model/Book.java`
- **Fields**: id, title, author, isbn, description, coverUrl, publishedDate, pdfUrl, previewAvailable, price
- **Relationships**: ManyToOne → Category (LAZY)
- **Key Features**:
  - Unique ISBN constraint
  - PDF support with preview flag
  - Price stored as BigDecimal (10,2 precision)
  - Category filtering via foreign key

#### User
- **Location**: `model/User.java`
- **Implements**: UserDetails (Spring Security)
- **Fields**: id, email, password, fullName, role, authProvider, googleId, bio, profileImageUrl, phone, address, hobbies, nameOverridden, dateOfBirth, createdAt, updatedAt
- **Key Features**:
  - Dual auth: LOCAL + GOOGLE OAuth
  - Role-based access (ROLE_ADMIN, ROLE_USER)
  - Profile customization fields
  - Timestamps (onCreate/onUpdate)

#### Bookshelf
- **Location**: `model/Bookshelf.java`
- **Fields**: id, name, position, theme, user_id, createdAt, updatedAt
- **Relationships**: ManyToOne → User (LAZY)
- **Key Features**:
  - User-owned shelves with ordering (position)
  - Theme support (default: "glass")
  - Indexed on (user_id, position) for efficient ordering

#### Category
- **Location**: `model/Category.java`
- **Fields**: id, name, description
- **Relationships**: OneToMany → Book (inverse)

#### WishlistItem
- **Location**: `model/WishlistItem.java`
- **Relationships**: ManyToOne → User, ManyToOne → Book
- **Unique Constraint**: (user_id, book_id)

#### CartItem
- **Location**: `model/CartItem.java`
- **Fields**: id, quantity, user_id, book_id, createdAt, updatedAt
- **Relationships**: ManyToOne → User, ManyToOne → Book
- **Unique Constraint**: (user_id, book_id)

#### ShelfBook
- **Location**: `model/ShelfBook.java`
- **Relationships**: ManyToOne → Bookshelf, ManyToOne → Book
- **Unique Constraint**: (bookshelf_id, book_id)
- **Purpose**: Join table for bookshelf-book many-to-many

### Data Model Observations

✅ **Strengths**:
- Clean separation of concerns (User, Book, Bookshelf, Cart, Wishlist)
- Proper use of LAZY loading to avoid N+1 queries
- Unique constraints prevent duplicates (ISBN, wishlist items, cart items)
- Timestamps on all mutable entities
- Foreign key constraints maintain referential integrity

⚠️ **Gaps/Considerations**:
- No soft-delete support (deleted books/users are hard-deleted)
- No audit trail for changes
- ShelfBook lacks ordering/position field (if shelf order matters)
- No explicit status field on orders (orderService is mocked)

---

## 2. REPOSITORIES

### Repository Pattern

All repositories extend `JpaRepository<Entity, Long>` with custom queries:

#### BookRepository
```java
searchBooks(query, categoryId, pageable)  // Native SQL with LIKE search
countByCategoryId(categoryId)
findByIdAndPdfUrlIsNotNull(id)            // For PDF reading
```
- **Query Type**: Native SQL (PostgreSQL-specific CONCAT)
- **Performance**: Paginated, indexed on category_id

#### UserRepository
```java
findByEmail(email)
findByGoogleId(googleId)
existsByEmail(email)
```

#### BookshelfRepository
```java
findByUserIdOrderByPositionAsc(userId)    // Ordered shelf list
findByIdAndUserId(id, userId)             // User ownership check
nextPosition(userId)                       // For new shelf positioning
```

#### CartItemRepository & WishlistRepository
```java
findByUserIdWithBook(userId)              // Eager load books
deleteByUserIdAndBookId(userId, bookId)   // Atomic removal
findByUserIdAndBookId(userId, bookId)     // Existence check
```

#### ShelfBookRepository
```java
findByBookshelfIdWithBook(bookshelfId)    // Eager load books
existsByBookshelfIdAndBookId(...)         // Duplicate prevention
countByBookshelfId(bookshelfId)           // Shelf size
```

### Repository Observations

✅ **Strengths**:
- Consistent naming conventions
- Proper use of custom queries for complex lookups
- Eager loading where needed (WithBook methods)
- Atomic operations (delete by composite key)

⚠️ **Gaps**:
- No pagination support in cart/wishlist (could be large)
- No soft-delete queries
- Search only supports title/author (no full-text search)

---

## 3. DTOs (Data Transfer Objects)

### Request DTOs
- `BookRequest`: title, author, isbn, description, coverUrl, publishedDate, categoryId, pdfUrl, previewAvailable, price
- `CategoryRequest`: name, description
- `CartItemRequest`: quantity
- `BookshelfRequest`: name, theme
- `ProfileRequest`: fullName, bio, profileImageUrl, phone, address, hobbies, dateOfBirth
- `LoginRequest`: email, password
- `RegisterRequest`: email, password, fullName
- `GoogleAuthRequest`: idToken

### Response DTOs
- `BookResponse`: id, title, author, isbn, description, coverUrl, publishedDate, categoryName, categoryId, pdfUrl, previewAvailable, price
- `CartResponse`: items (CartItemResponse[]), totalPrice
- `CartItemResponse`: id, bookId, bookTitle, quantity, price
- `WishlistItemResponse`: id, bookId, bookTitle, author, coverUrl, price
- `BookshelfResponse`: id, name, position, theme, createdAt, updatedAt
- `ShelfBookResponse`: id, bookId, bookTitle, author, coverUrl
- `ProfileResponse`: id, email, fullName, bio, profileImageUrl, phone, address, hobbies, dateOfBirth, role
- `AuthResponse`: token, user (ProfileResponse)
- `PagedResponse<T>`: content, page, size, totalElements, totalPages, first, last, empty
- `ReadBookResponse`: id, title, author, pdfUrl, previewAvailable, coverUrl
- `ErrorResponse`: timestamp, status, message, details

### DTO Observations

✅ **Strengths**:
- Consistent use of Lombok (@Builder, @Getter, @Setter)
- Separation of request/response contracts
- PagedResponse for pagination metadata
- ReadBookResponse for PDF-specific data

⚠️ **Gaps**:
- No validation annotations (@NotNull, @Email, @Size) on request DTOs
- BookResponse includes categoryName but not full Category object (denormalized)
- No DTO for batch operations (e.g., reorder shelves)

---

## 4. SERVICES

### Service Layer Architecture

All services use `@Service` + `@RequiredArgsConstructor` (Lombok constructor injection).

#### BookService
```java
getBooks(query, categoryId, page, size, sortBy, sortDir)  // Paginated search
getBookById(id)
getReadBookInfo(id)                                         // PDF metadata
createBook(BookRequest)                                     // Admin
updateBook(id, BookRequest)                                // Admin
deleteBook(id)                                              // Admin
```
- **Transactional**: createBook, updateBook, deleteBook
- **Conversion**: toResponse() helper for Book → BookResponse

#### BookshelfService
```java
getUserBookshelves(userId)
createBookshelf(userId, BookshelfRequest)
updateBookshelf(id, userId, BookshelfRequest)
deleteBookshelf(id, userId)
reorder(userId, List<Long> shelfIds)                       // Reorder by position
```
- **Ownership Check**: All operations verify userId matches
- **Position Management**: Automatic position assignment on create

#### CartService
```java
getCart(userId)
addToCart(userId, bookId, quantity)
updateQuantity(userId, bookId, quantity)
removeFromCart(userId, bookId)
```
- **Atomic Operations**: Upsert logic (add or update)
- **Response Building**: buildCartResponse() aggregates items + total

#### WishlistService
```java
getUserWishlist(userId)
addToWishlist(userId, bookId)
removeFromWishlist(userId, bookId)
```
- **Duplicate Prevention**: Unique constraint at DB level

#### AuthService
```java
register(RegisterRequest)
login(LoginRequest)
```
- **Password Hashing**: Uses ApplicationConfig.passwordEncoder()
- **JWT Generation**: Delegates to JwtService

#### GoogleAuthService
```java
authenticateWithGoogle(GoogleAuthRequest)
verifyGoogleToken(idToken)
```
- **OAuth Flow**: Verifies Google token, creates/updates User

#### ProfileService
```java
getProfile(userId)
updateProfile(userId, ProfileRequest)
```

#### CategoryService
```java
getAllCategories()
saveCategory(CategoryRequest)
updateCategory(id, CategoryRequest)
deleteCategory(id)
```

### Service Observations

✅ **Strengths**:
- Thin controllers, business logic in services
- Consistent error handling (throws exceptions caught by GlobalExceptionHandler)
- Transactional boundaries clearly marked
- Ownership checks prevent unauthorized access

⚠️ **Gaps**:
- No caching (e.g., categories fetched on every request)
- No batch operations (e.g., bulk add to cart)
- No soft-delete support
- Limited validation (delegated to DTOs, but DTOs lack annotations)

---

## 5. MIGRATIONS (Flyway)

### Migration Timeline

| Version | Purpose |
|---------|---------|
| V1 | Create categories table |
| V2 | Create users table (email unique, role enum) |
| V3 | Create books table (isbn unique, category FK) |
| V4 | Create wishlist_items table (user_id, book_id unique) |
| V5 | Seed categories and books |
| V6 | Add search indexes on books (title, author) |
| V7 | Add pdf_url, preview_available to books |
| V8 | Create bookshelves table (user_id, position indexed) |
| V9 | Create cart_items table (user_id, book_id unique) |
| V10 | Add profile fields to users (bio, phone, address, hobbies) |
| V11 | Create shelf_books join table (bookshelf_id, book_id unique) |
| V12 | Add unique constraint + index on wishlist |
| V13 | Seed demo users |
| V14 | Seed additional books |
| V15 | Seed demo wishlist |
| V16 | Add OAuth support (auth_provider, google_id) |
| V17 | Add more profile fields (profile_image_url, date_of_birth) |
| V18 | Add theme to bookshelves |
| V19 | Add name_overridden flag to users |

### Migration Observations

✅ **Strengths**:
- Incremental, reversible migrations
- Proper indexing on foreign keys and search columns
- Seed data for development
- Unique constraints prevent duplicates

⚠️ **Gaps**:
- No rollback migrations (V1 down, V2 down, etc.)
- No audit table for tracking changes
- No soft-delete column (deleted_at)
- Seed data hardcoded (V5, V13-V15) — not ideal for production

---

## 6. CONTROLLERS

### Controller Pattern

All controllers use `@RestController` + `@RequiredArgsConstructor` with Swagger annotations.

#### BookController (Public)
```
GET  /api/books              → getBooks(q, categoryId, page, size, sortBy, sortDir)
GET  /api/books/{id}         → getBookById(id)
GET  /api/books/{id}/read    → getReadBookInfo(id)
```

#### BookAdminController (Admin-only)
```
POST   /api/admin/books      → createBook(BookRequest)
PUT    /api/admin/books/{id} → updateBook(id, BookRequest)
DELETE /api/admin/books/{id} → deleteBook(id)
```

#### CategoryController (Public)
```
GET /api/categories          → getCategories()
```

#### CategoryAdminController (Admin-only)
```
POST   /api/admin/categories      → createCategory(CategoryRequest)
PUT    /api/admin/categories/{id} → updateCategory(id, CategoryRequest)
DELETE /api/admin/categories/{id} → deleteCategory(id)
```

#### AuthController (Public)
```
POST /api/auth/register      → register(RegisterRequest)
POST /api/auth/login         → login(LoginRequest)
POST /api/auth/google        → googleAuth(GoogleAuthRequest)
```

#### WishlistController (Authenticated)
```
GET    /api/wishlist         → getWishlist()
POST   /api/wishlist/{id}    → addToWishlist(bookId)
DELETE /api/wishlist/{id}    → removeFromWishlist(bookId)
```

#### CartController (Authenticated)
```
GET    /api/cart             → getCart()
POST   /api/cart/{id}        → addToCart(bookId, quantity)
PUT    /api/cart/{id}        → updateQuantity(bookId, quantity)
DELETE /api/cart/{id}        → removeFromCart(bookId)
```

#### BookshelfController (Authenticated)
```
GET    /api/bookshelves                    → getBookshelves()
POST   /api/bookshelves                    → createBookshelf(BookshelfRequest)
PUT    /api/bookshelves/{id}               → updateBookshelf(id, BookshelfRequest)
DELETE /api/bookshelves/{id}               → deleteBookshelf(id)
POST   /api/bookshelves/reorder            → reorder(List<Long>)
GET    /api/bookshelves/{id}/books         → getShelfBooks(shelfId)
POST   /api/bookshelves/{id}/books/{bid}   → addBookToShelf(shelfId, bookId)
DELETE /api/bookshelves/{id}/books/{bid}   → removeBookFromShelf(shelfId, bookId)
```

#### ProfileController (Authenticated)
```
GET /api/profile             → getProfile()
PUT /api/profile             → updateProfile(ProfileRequest)
```

### Controller Observations

✅ **Strengths**:
- Thin controllers (delegate to services)
- Clear separation: public vs admin vs authenticated
- Swagger documentation on all endpoints
- Consistent error handling via GlobalExceptionHandler

⚠️ **Gaps**:
- No request validation (e.g., @Valid on @RequestBody)
- No rate limiting
- No API versioning (all v1 implicitly)
- Admin endpoints lack explicit @PreAuthorize("ROLE_ADMIN")

---

## 7. FRONTEND INTEGRATION

### API Client (`frontend/src/api/api.js`)

**Base URL**: `http://localhost:8080/api`

**Interceptors**:
- Request: Injects JWT token from localStorage
- Response: On 401 (non-auth endpoints), clears session and redirects to `/shop-login`

**Services**:
- `authService`: login, register, googleAuth
- `bookService`: getAll, getById, getByCategory, getMyBooks
- `categoryService`: getAll
- `wishlistService`: getWishlist, addToWishlist, removeFromWishlist
- `userService`: getProfile, updateProfile
- `bookshelfService`: getAll, create, update, delete, reorder, getBooks, addBook, removeBook
- `cartService`: getCart, addToCart, updateQuantity, removeFromCart
- `orderService`: **MOCKED** (checkout, getUserOrders, getHistory)
- `reviewService`: **MOCKED** (getByBookId, addReview)

### Frontend Pages

#### BookListPage
- Fetches books via `bookService.getAll()`
- Displays books with add-to-wishlist and add-to-cart actions
- Uses SweetAlert2 for notifications

#### VirtualBookshelf
- Fetches books via `bookService.getMyBooks()`
- Fetches bookshelves via `bookshelfService.getAll()`
- Supports shelf management (create, update, delete, reorder)
- Persists UI state to localStorage (sort, logo, menu visibility)
- Fallback demo books if API fails

#### ShopCart
- Fetches cart via `cartService.getCart()`
- Supports quantity updates and item removal
- Displays total price

#### Wishlist
- Fetches wishlist via `wishlistService.getWishlist()`
- Supports removal from wishlist

#### ShopDetail
- Fetches book details via `bookService.getById(id)`
- Displays book info, reviews (mocked), and add-to-cart/wishlist

### Frontend Observations

✅ **Strengths**:
- Centralized API client with interceptors
- Consistent error handling (401 redirects to login)
- SweetAlert2 for user feedback
- Fallback demo data for offline/API failure

⚠️ **Gaps**:
- `orderService` and `reviewService` are mocked (no backend implementation)
- No pagination in wishlist/cart (could be large)
- No caching strategy (every page load fetches fresh data)
- No error boundary for API failures
- localStorage used for UI state (not synced with backend)

---

## 8. SECURITY

### JWT Authentication
- **Service**: `JwtService` (extract claims, validate, generate tokens)
- **Filter**: `JwtAuthenticationFilter` (intercepts requests, validates token)
- **Config**: `SecurityConfig` (filter chain, CORS, password encoder)

### Authorization
- **Role-based**: ROLE_ADMIN for admin endpoints, ROLE_USER for authenticated endpoints
- **Ownership checks**: Services verify userId matches (e.g., bookshelf, cart, wishlist)

### CORS
- **Default**: Allows `http://localhost:3000`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: Allowed

### Observations

✅ **Strengths**:
- JWT stateless auth
- Role-based access control
- Ownership checks prevent unauthorized access

⚠️ **Gaps**:
- No @PreAuthorize annotations on admin endpoints (relies on controller routing)
- No rate limiting
- No CSRF protection (stateless API, but could be added)
- JWT secret in application.properties (should use environment variables)

---

## 9. SUMMARY TABLE

| Layer | Status | Key Files | Issues |
|-------|--------|-----------|--------|
| **Entities** | ✅ Complete | Book, User, Bookshelf, Category, Cart, Wishlist, ShelfBook | No soft-delete, no audit trail |
| **Repositories** | ✅ Complete | 7 repositories with custom queries | No pagination in cart/wishlist |
| **DTOs** | ✅ Complete | 20+ request/response DTOs | No validation annotations |
| **Services** | ✅ Complete | 9 services with business logic | No caching, no batch ops |
| **Controllers** | ✅ Complete | 8 controllers (public, admin, auth) | No @Valid, no rate limiting |
| **Migrations** | ✅ Complete | 19 migrations (V1-V19) | No rollbacks, hardcoded seed data |
| **Frontend API** | ⚠️ Partial | api.js + 6 pages | orderService & reviewService mocked |
| **Security** | ✅ Complete | JWT + role-based + ownership checks | No @PreAuthorize, JWT secret in config |

---

## 10. RECOMMENDATIONS FOR CHANGES

### High Priority
1. **Add validation annotations** to request DTOs (@NotNull, @Email, @Size)
2. **Implement orderService** backend (Order entity, OrderItem, OrderRepository, OrderService, OrderController)
3. **Add @PreAuthorize** annotations to admin endpoints
4. **Implement reviewService** backend (Review entity, ReviewRepository, ReviewService, ReviewController)

### Medium Priority
5. Add pagination to cart/wishlist
6. Implement caching for categories
7. Add soft-delete support (deleted_at column)
8. Move JWT secret to environment variables

### Low Priority
9. Add full-text search for books
10. Implement audit trail for changes
11. Add rate limiting
12. Add CSRF protection

---

**Next Steps**: Ready to implement any of the above. Which area should we focus on first?
