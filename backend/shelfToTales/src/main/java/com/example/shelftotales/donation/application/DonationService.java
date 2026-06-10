package com.example.shelftotales.donation.application;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.donation.domain.Donation;
import com.example.shelftotales.donation.domain.DonationRequest;
import com.example.shelftotales.donation.infrastructure.DonationRepository;
import com.example.shelftotales.donation.infrastructure.DonationRequestRepository;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository donationRepository;
    private final DonationRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    @Transactional
    public DonationResponseDto createDonation(DonationRequestDto dto) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        Book book = null;
        if (dto.getBookId() != null) {
            book = bookRepository.findById(dto.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        }

        Donation donation = Donation.builder()
                .donor(currentUser)
                .book(book)
                .customTitle(dto.getCustomTitle())
                .customAuthor(dto.getCustomAuthor())
                .description(dto.getDescription())
                .condition(dto.getCondition())
                .status("AVAILABLE")
                .build();

        donation = donationRepository.save(donation);
        return mapToDto(donation);
    }

    @Transactional(readOnly = true)
    public Page<DonationResponseDto> getAvailableDonations(Pageable pageable) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return donationRepository.findAvailableDonations(currentUser.getId(), pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public DonationResponseDto getDonationDetails(Long id) {
        Donation donation = donationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));
        return mapToDto(donation);
    }

    @Transactional
    public DonationRequestResponseDto requestDonation(Long donationId, String reason) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));

        if (donation.getDonor().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Cannot request your own donation");
        }

        if (!"AVAILABLE".equals(donation.getStatus())) {
            throw new IllegalArgumentException("Donation is not available");
        }

        requestRepository.findByDonationIdAndRecipientId(donationId, currentUser.getId())
                .ifPresent(req -> { throw new IllegalArgumentException("Already requested this donation"); });

        DonationRequest request = DonationRequest.builder()
                .donation(donation)
                .recipient(currentUser)
                .reason(reason)
                .status("PENDING")
                .build();

        request = requestRepository.save(request);
        return mapToRequestDto(request);
    }

    @Transactional(readOnly = true)
    public List<DonationRequestResponseDto> getRequestsForDonation(Long donationId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation not found"));

        if (!donation.getDonor().getId().equals(currentUser.getId())) {
            throw new SecurityException("Only the donor can view requests");
        }

        return requestRepository.findByDonationId(donationId).stream()
                .map(this::mapToRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveRequest(Long requestId) {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        DonationRequest approvedRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        Donation donation = approvedRequest.getDonation();
        if (!donation.getDonor().getId().equals(currentUser.getId())) {
            throw new SecurityException("Only the donor can approve requests");
        }

        if (!"AVAILABLE".equals(donation.getStatus())) {
            throw new IllegalArgumentException("Donation has already been matched");
        }

        // Update requests status
        List<DonationRequest> allRequests = requestRepository.findByDonationId(donation.getId());
        for (DonationRequest req : allRequests) {
            if (req.getId().equals(requestId)) {
                req.setStatus("APPROVED");
            } else {
                req.setStatus("REJECTED");
            }
            requestRepository.save(req);
        }

        donation.setStatus("MATCHED");
        donationRepository.save(donation);
    }

    @Transactional(readOnly = true)
    public List<DonationResponseDto> getDonorDonations() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return donationRepository.findByDonorId(currentUser.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DonationRequestResponseDto> getRecipientRequests() {
        User currentUser = AuthUtils.getCurrentUser(userRepository);
        return requestRepository.findByRecipientId(currentUser.getId()).stream()
                .map(this::mapToRequestDto)
                .collect(Collectors.toList());
    }

    private DonationResponseDto mapToDto(Donation d) {
        return DonationResponseDto.builder()
                .id(d.getId())
                .donorId(d.getDonor().getId())
                .donorName(d.getDonor().getFullName())
                .bookId(d.getBook() != null ? d.getBook().getId() : null)
                .bookTitle(d.getBook() != null ? d.getBook().getTitle() : null)
                .bookAuthor(d.getBook() != null ? d.getBook().getAuthor() : null)
                .bookCoverUrl(d.getBook() != null ? d.getBook().getCoverUrl() : null)
                .customTitle(d.getCustomTitle())
                .customAuthor(d.getCustomAuthor())
                .description(d.getDescription())
                .condition(d.getCondition())
                .status(d.getStatus())
                .createdAt(d.getCreatedAt())
                .build();
    }

    private DonationRequestResponseDto mapToRequestDto(DonationRequest r) {
        String bookTitle = r.getDonation().getBook() != null ? 
                r.getDonation().getBook().getTitle() : r.getDonation().getCustomTitle();

        return DonationRequestResponseDto.builder()
                .id(r.getId())
                .donationId(r.getDonation().getId())
                .donationBookTitle(bookTitle)
                .recipientId(r.getRecipient().getId())
                .recipientName(r.getRecipient().getFullName())
                .recipientEmail(r.getRecipient().getEmail())
                .donorName(r.getDonation().getDonor().getFullName())
                .donorEmail(r.getDonation().getDonor().getEmail())
                .reason(r.getReason())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
