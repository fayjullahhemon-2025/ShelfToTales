package com.example.shelftotales.service;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.domain.Role;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.blog.domain.BlogPost;
import com.example.shelftotales.blog.infrastructure.BlogPostRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.exchange.domain.ExchangeListing;
import com.example.shelftotales.exchange.infrastructure.ExchangeListingRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.moderation.application.*;
import com.example.shelftotales.moderation.domain.ContentReport;
import com.example.shelftotales.moderation.infrastructure.ContentReportRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContentReportServiceTest {

    @Mock private ContentReportRepository reportRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private BlogPostRepository blogPostRepository;
    @Mock private ExchangeListingRepository exchangeListingRepository;

    @InjectMocks private ContentReportService reportService;

    private User testUser;
    private ContentReport testReport;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("reporter@test.com")
                .fullName("Reporter User")
                .role(Role.USER)
                .build();

        testReport = ContentReport.builder()
                .id(10L)
                .reporter(testUser)
                .targetType("REVIEW")
                .targetId(100L)
                .reason("SPAM")
                .explanation("Spam explanation")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void testCreateReport_Succeeds() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(reportRepository.findByReporterIdAndTargetTypeAndTargetId(1L, "REVIEW", 100L)).thenReturn(Optional.empty());
            when(reportRepository.save(any(ContentReport.class))).thenReturn(testReport);

            ReportRequestDto requestDto = ReportRequestDto.builder()
                    .targetType("REVIEW")
                    .targetId(100L)
                    .reason("SPAM")
                    .explanation("Spam explanation")
                    .build();

            ReportResponseDto response = reportService.createReport(requestDto);

            assertNotNull(response);
            assertEquals("PENDING", response.getStatus());
            assertEquals(10L, response.getId());
            assertEquals("REVIEW", response.getTargetType());
            assertEquals(100L, response.getTargetId());
        }
    }

    @Test
    void testCreateReport_AlreadyReported_ThrowsException() {
        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(testUser);
            when(reportRepository.findByReporterIdAndTargetTypeAndTargetId(1L, "REVIEW", 100L)).thenReturn(Optional.of(testReport));

            ReportRequestDto requestDto = ReportRequestDto.builder()
                    .targetType("REVIEW")
                    .targetId(100L)
                    .reason("SPAM")
                    .explanation("Spam explanation")
                    .build();

            assertThrows(IllegalArgumentException.class, () -> reportService.createReport(requestDto));
            verify(reportRepository, never()).save(any(ContentReport.class));
        }
    }

    @Test
    void testGetPendingReports_MapsPreviews() {
        ContentReport reviewReport = ContentReport.builder()
                .id(10L)
                .reporter(testUser)
                .targetType("REVIEW")
                .targetId(100L)
                .reason("SPAM")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        ContentReport blogReport = ContentReport.builder()
                .id(11L)
                .reporter(testUser)
                .targetType("BLOG_POST")
                .targetId(200L)
                .reason("OFFENSIVE")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        ContentReport exchangeReport = ContentReport.builder()
                .id(12L)
                .reporter(testUser)
                .targetType("EXCHANGE_LISTING")
                .targetId(300L)
                .reason("SCAM")
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        when(reportRepository.findByStatusOrderByCreatedAtDesc("PENDING"))
                .thenReturn(List.of(reviewReport, blogReport, exchangeReport));

        // Mock targets
        Book book = Book.builder().title("Book Title").build();
        Review review = Review.builder().user(testUser).book(book).comment("Bad review").build();
        when(reviewRepository.findById(100L)).thenReturn(Optional.of(review));

        BlogPost blogPost = BlogPost.builder().title("Blog Title").content("Offensive content").build();
        when(blogPostRepository.findById(200L)).thenReturn(Optional.of(blogPost));

        ExchangeListing listing = ExchangeListing.builder().type("SWAP").book(book).description("Trade item").build();
        when(exchangeListingRepository.findById(300L)).thenReturn(Optional.of(listing));

        List<ReportResponseDto> pending = reportService.getPendingReports();

        assertEquals(3, pending.size());
        
        ReportResponseDto r0 = pending.get(0);
        assertEquals("REVIEW", r0.getTargetType());
        assertTrue(r0.getContentPreview().contains("Bad review"));

        ReportResponseDto r1 = pending.get(1);
        assertEquals("BLOG_POST", r1.getTargetType());
        assertTrue(r1.getContentPreview().contains("Blog Title"));

        ReportResponseDto r2 = pending.get(2);
        assertEquals("EXCHANGE_LISTING", r2.getTargetType());
        assertTrue(r2.getContentPreview().contains("Trade item"));
    }

    @Test
    void testDismissReport_Succeeds() {
        when(reportRepository.findById(10L)).thenReturn(Optional.of(testReport));
        when(reportRepository.save(any(ContentReport.class))).thenReturn(testReport);

        reportService.dismissReport(10L);

        assertEquals("DISMISSED", testReport.getStatus());
        verify(reportRepository, times(1)).save(testReport);
    }

    @Test
    void testDismissReport_NotFound_ThrowsException() {
        when(reportRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> reportService.dismissReport(999L));
    }

    @Test
    void testActionReport_DeletesReview() {
        when(reportRepository.findById(10L)).thenReturn(Optional.of(testReport));
        doNothing().when(reviewRepository).deleteById(100L);
        when(reportRepository.save(any(ContentReport.class))).thenReturn(testReport);

        reportService.actionReport(10L);

        verify(reviewRepository, times(1)).deleteById(100L);
        assertEquals("ACTIONED", testReport.getStatus());
        verify(reportRepository, times(1)).save(testReport);
    }

    @Test
    void testActionReport_DeletesBlogPost() {
        ContentReport blogReport = ContentReport.builder()
                .id(11L)
                .reporter(testUser)
                .targetType("BLOG_POST")
                .targetId(200L)
                .reason("OFFENSIVE")
                .status("PENDING")
                .build();

        when(reportRepository.findById(11L)).thenReturn(Optional.of(blogReport));
        doNothing().when(blogPostRepository).deleteById(200L);
        when(reportRepository.save(any(ContentReport.class))).thenReturn(blogReport);

        reportService.actionReport(11L);

        verify(blogPostRepository, times(1)).deleteById(200L);
        assertEquals("ACTIONED", blogReport.getStatus());
        verify(reportRepository, times(1)).save(blogReport);
    }

    @Test
    void testActionReport_DeletesExchangeListing() {
        ContentReport exchangeReport = ContentReport.builder()
                .id(12L)
                .reporter(testUser)
                .targetType("EXCHANGE_LISTING")
                .targetId(300L)
                .reason("SCAM")
                .status("PENDING")
                .build();

        when(reportRepository.findById(12L)).thenReturn(Optional.of(exchangeReport));
        doNothing().when(exchangeListingRepository).deleteById(300L);
        when(reportRepository.save(any(ContentReport.class))).thenReturn(exchangeReport);

        reportService.actionReport(12L);

        verify(exchangeListingRepository, times(1)).deleteById(300L);
        assertEquals("ACTIONED", exchangeReport.getStatus());
        verify(reportRepository, times(1)).save(exchangeReport);
    }
}
