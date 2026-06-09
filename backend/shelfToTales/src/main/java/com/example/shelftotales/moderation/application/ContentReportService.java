package com.example.shelftotales.moderation.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.blog.domain.BlogPost;
import com.example.shelftotales.blog.infrastructure.BlogPostRepository;
import com.example.shelftotales.exchange.domain.ExchangeListing;
import com.example.shelftotales.exchange.infrastructure.ExchangeListingRepository;
import com.example.shelftotales.review.domain.Review;
import com.example.shelftotales.review.infrastructure.ReviewRepository;
import com.example.shelftotales.review.domain.ReviewComment;
import com.example.shelftotales.review.infrastructure.ReviewCommentRepository;
import com.example.shelftotales.moderation.domain.ContentReport;
import com.example.shelftotales.moderation.infrastructure.ContentReportRepository;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentReportService {

    private final ContentReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final BlogPostRepository blogPostRepository;
    private final ExchangeListingRepository exchangeListingRepository;
    private final ReviewCommentRepository reviewCommentRepository;

    @Transactional
    public ReportResponseDto createReport(ReportRequestDto dto) {
        User reporter = AuthUtils.getCurrentUser(userRepository);

        reportRepository.findByReporterIdAndTargetTypeAndTargetId(reporter.getId(), dto.getTargetType(), dto.getTargetId())
                .ifPresent(r -> { throw new IllegalArgumentException("You have already reported this content"); });

        ContentReport report = ContentReport.builder()
                .reporter(reporter)
                .targetType(dto.getTargetType())
                .targetId(dto.getTargetId())
                .reason(dto.getReason())
                .explanation(dto.getExplanation())
                .status("PENDING")
                .build();

        report = reportRepository.save(report);
        return mapToDto(report);
    }

    @Transactional(readOnly = true)
    public List<ReportResponseDto> getPendingReports() {
        return reportRepository.findByStatusOrderByCreatedAtDesc("PENDING").stream()
                .map(this::mapToDtoWithPreview)
                .collect(Collectors.toList());
    }

    @Transactional
    public void dismissReport(Long reportId) {
        ContentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));
        report.setStatus("DISMISSED");
        reportRepository.save(report);
    }

    @Transactional
    public void actionReport(Long reportId) {
        ContentReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found"));

        // Hard delete target content
        try {
            switch (report.getTargetType()) {
                case "REVIEW":
                    reviewRepository.deleteById(report.getTargetId());
                    break;
                case "BLOG_POST":
                    blogPostRepository.deleteById(report.getTargetId());
                    break;
                case "EXCHANGE_LISTING":
                    exchangeListingRepository.deleteById(report.getTargetId());
                    break;
                case "REVIEW_COMMENT":
                    reviewCommentRepository.deleteById(report.getTargetId());
                    break;
                default:
                    throw new IllegalArgumentException("Unknown target type: " + report.getTargetType());
            }
        } catch (Exception e) {
            // Target might already be deleted
        }

        report.setStatus("ACTIONED");
        reportRepository.save(report);
    }

    private ReportResponseDto mapToDto(ContentReport r) {
        return ReportResponseDto.builder()
                .id(r.getId())
                .reporterId(r.getReporter().getId())
                .reporterName(r.getReporter().getFullName())
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .reason(r.getReason())
                .explanation(r.getExplanation())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private ReportResponseDto mapToDtoWithPreview(ContentReport r) {
        ReportResponseDto dto = mapToDto(r);
        String preview = "[Content Deleted]";
        try {
            switch (r.getTargetType()) {
                case "REVIEW":
                    Review rv = reviewRepository.findById(r.getTargetId()).orElse(null);
                    if (rv != null) {
                        preview = "Review by " + rv.getUser().getFullName() + " on Book '" + rv.getBook().getTitle() + "': \"" + rv.getComment() + "\"";
                    }
                    break;
                case "BLOG_POST":
                    BlogPost post = blogPostRepository.findById(r.getTargetId()).orElse(null);
                    if (post != null) {
                        preview = "Blog Post Title: '" + post.getTitle() + "' - Content: \"" + post.getContent() + "\"";
                    }
                    break;
                case "EXCHANGE_LISTING":
                    ExchangeListing listing = exchangeListingRepository.findById(r.getTargetId()).orElse(null);
                    if (listing != null) {
                        preview = "Exchange Listing (Type: " + listing.getType() + ") for '" + listing.getBook().getTitle() + "': \"" + listing.getDescription() + "\"";
                    }
                    break;
                case "REVIEW_COMMENT":
                    ReviewComment rc = reviewCommentRepository.findById(r.getTargetId()).orElse(null);
                    if (rc != null) {
                        preview = "Comment by " + rc.getUser().getFullName() + " replying to " +
                                (rc.getParentComment() != null ? "Comment ID " + rc.getParentComment().getId() : "Review ID " + rc.getReview().getId()) +
                                ": \"" + rc.getContent() + "\"";
                    }
                    break;
            }
        } catch (Exception e) {
            preview = "[Error loading preview]";
        }
        dto.setContentPreview(preview);
        return dto;
    }
}
