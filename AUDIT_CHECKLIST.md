# ShelfToTales Audit - Implementation Checklist

## 🔴 CRITICAL (Week 1)

### Frontend
- [ ] **Code Splitting** - Implement React.lazy() for all routes
  - Files: `frontend/src/routes/AppRoutes.js`
  - Estimated Time: 2-3 hours
  - Expected Benefit: 60% bundle reduction

- [ ] **Memory Leak Fix** - Clean up scroll event listener
  - Files: `frontend/src/components/layout/Header.js`
  - Estimated Time: 30 minutes
  - Expected Benefit: Prevent memory growth

- [ ] **Input Validation** - Add @Valid to all DTOs
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/dto/`
  - Estimated Time: 1 hour
  - Expected Benefit: Better error handling

### Backend
- [ ] **N+1 Query Fix - CartService**
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/repository/CartItemRepository.java`
  - Add: `@EntityGraph(attributePaths = {"book", "user"})`
  - Estimated Time: 30 minutes
  - Expected Benefit: 90% fewer queries

- [ ] **N+1 Query Fix - BookshelfService**
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/repository/BookshelfRepository.java`
  - Add: `@EntityGraph(attributePaths = {"shelfBooks", "shelfBooks.book"})`
  - Estimated Time: 30 minutes
  - Expected Benefit: 80% fewer queries

---

## ⚠️ HIGH PRIORITY (Week 2-3)

### Frontend
- [ ] **React.memo Optimization**
  - Files: `frontend/src/pages/Bookshelf/VirtualBookshelf.js`, `frontend/src/components/layout/Header.js`
  - Estimated Time: 3-4 hours
  - Expected Benefit: 30-50% fewer re-renders

- [ ] **useMemo for Expensive Computations**
  - Files: `frontend/src/pages/Books/BooksGridView.js`, `frontend/src/pages/Bookshelf/VirtualBookshelf.js`
  - Estimated Time: 2-3 hours
  - Expected Benefit: Faster filtering/sorting

- [ ] **Error Boundaries on Critical Sections**
  - Files: `frontend/src/routes/AppRoutes.js`
  - Estimated Time: 1-2 hours
  - Expected Benefit: Better error recovery

- [ ] **Remove Duplicate Routes**
  - Files: `frontend/src/routes/AppRoutes.js`
  - Remove: `/shop-list`, `/book-list` (keep `/books-list`)
  - Estimated Time: 30 minutes
  - Expected Benefit: Cleaner routing

### Backend
- [ ] **Redis Caching Setup**
  - Files: `backend/shelfToTales/pom.xml`, `backend/shelfToTales/src/main/resources/application.yml`
  - Add: Spring Data Redis dependency
  - Estimated Time: 4-6 hours
  - Expected Benefit: 70-80% fewer DB queries

- [ ] **Cache Categories**
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/service/CategoryService.java`
  - Add: `@Cacheable` and `@CacheEvict` annotations
  - Estimated Time: 1 hour
  - Expected Benefit: Instant category loads

- [ ] **Rate Limiting on Auth**
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/config/SecurityConfig.java`
  - Add: Rate limiter for `/api/auth/**`
  - Estimated Time: 2-3 hours
  - Expected Benefit: Prevent brute force attacks

- [ ] **Pagination Size Limits**
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/controller/BookController.java`
  - Add: `@Max(100)` on size parameter
  - Estimated Time: 30 minutes
  - Expected Benefit: Prevent abuse

---

## 📊 MEDIUM PRIORITY (Week 4)

### Frontend
- [ ] **Image Optimization**
  - Files: `frontend/src/pages/Bookshelf/VirtualBookshelf.js`, `frontend/src/components/`
  - Add: Lazy loading, responsive sizes, WebP support
  - Estimated Time: 3-4 hours
  - Expected Benefit: 40-50% smaller images

- [ ] **Bundle Analysis Tool**
  - Add: `source-map-explorer` to package.json
  - Estimated Time: 30 minutes
  - Expected Benefit: Track bundle size over time

- [ ] **Fix localStorage Sync Reads**
  - Files: `frontend/src/pages/Bookshelf/VirtualBookshelf.js`
  - Create: `useLocalStorage` custom hook
  - Estimated Time: 1-2 hours
  - Expected Benefit: Cleaner code, better error handling

### Backend
- [ ] **Strengthen Password Validation**
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/util/PasswordValidator.java`
  - Add: Complexity requirements, common password check
  - Estimated Time: 1-2 hours
  - Expected Benefit: Better security

- [ ] **Response Compression**
  - Files: `backend/shelfToTales/src/main/resources/application.yml`
  - Add: `server.compression.enabled: true`
  - Estimated Time: 30 minutes
  - Expected Benefit: 60-70% smaller responses

- [ ] **Fix BookRepository Query**
  - Files: `backend/shelfToTales/src/main/java/com/example/shelftotales/repository/BookRepository.java`
  - Change: Native query to JPQL with @EntityGraph
  - Estimated Time: 1 hour
  - Expected Benefit: Proper entity graph support

---

## 🎯 NICE TO HAVE (Week 5+)

### Frontend
- [ ] **Service Workers for Offline Support**
  - Estimated Time: 6-8 hours
  - Expected Benefit: Works offline, faster repeat visits

- [ ] **Performance Monitoring (Sentry/DataDog)**
  - Estimated Time: 4-6 hours
  - Expected Benefit: Real-time error tracking

- [ ] **Refactor VirtualBookshelf with useReducer**
  - Estimated Time: 4-6 hours
  - Expected Benefit: Better state management

### Backend
- [ ] **Refresh Token Mechanism**
  - Estimated Time: 3-4 hours
  - Expected Benefit: Better security, longer sessions

- [ ] **Database Query Logging**
  - Estimated Time: 2-3 hours
  - Expected Benefit: Identify slow queries

- [ ] **API Documentation (Swagger)**
  - Already configured, just enhance it
  - Estimated Time: 2-3 hours
  - Expected Benefit: Better developer experience

---

## 📈 Success Metrics

Track these metrics before and after implementation:

### Frontend
- [ ] Bundle size (target: <200KB)
- [ ] First Contentful Paint (target: <1.5s)
- [ ] Time to Interactive (target: <2.5s)
- [ ] Lighthouse Performance score (target: >80)
- [ ] Number of re-renders (use React DevTools Profiler)

### Backend
- [ ] Average API response time (target: <100ms)
- [ ] Database queries per request (target: <2)
- [ ] Cache hit rate (target: >70%)
- [ ] API throughput (target: >500 req/s)
- [ ] Error rate (target: <0.1%)

---

## 🚀 Implementation Order

1. **Start with critical fixes** (Week 1) - highest impact, lowest effort
2. **Move to high priority** (Week 2-3) - significant improvements
3. **Address medium priority** (Week 4) - polish and optimization
4. **Consider nice to have** (Week 5+) - advanced features

---

## 📝 Notes

- Each task should have a corresponding GitHub issue/ticket
- Assign owners for each task
- Create feature branches for each task
- Run tests after each change
- Update this checklist as you complete tasks
- Schedule follow-up audit in 4 weeks

---

**Last Updated:** May 18, 2026
**Total Estimated Effort:** 40-50 hours
**Expected Performance Improvement:** 60-85%
