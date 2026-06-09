package com.example.shelftotales.service;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.catalog.domain.Book;
import com.example.shelftotales.catalog.infrastructure.BookRepository;
import com.example.shelftotales.donation.application.*;
import com.example.shelftotales.donation.domain.Donation;
import com.example.shelftotales.donation.domain.DonationRequest;
import com.example.shelftotales.donation.infrastructure.DonationRepository;
import com.example.shelftotales.donation.infrastructure.DonationRequestRepository;
import com.example.shelftotales.shared.exception.ResourceNotFoundException;
import com.example.shelftotales.shared.util.AuthUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DonationServiceTest {

    @Mock private DonationRepository donationRepository;
    @Mock private DonationRequestRepository requestRepository;
    @Mock private UserRepository userRepository;
    @Mock private BookRepository bookRepository;

    @InjectMocks private DonationService donationService;

    @Test
    void createDonation_catalogBook_success() {
        User user = User.builder().id(1L).fullName("Donor User").build();
        Book book = Book.builder().id(100L).title("Catalog Book").author("Catalog Author").build();
        DonationRequestDto dto = DonationRequestDto.builder()
                .bookId(100L)
                .condition("GOOD")
                .description("Nice book")
                .build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(bookRepository.findById(100L)).thenReturn(Optional.of(book));
            when(donationRepository.save(any(Donation.class))).thenAnswer(i -> {
                Donation d = i.getArgument(0);
                d.setId(10L);
                return d;
            });

            DonationResponseDto response = donationService.createDonation(dto);

            assertNotNull(response);
            assertEquals(10L, response.getId());
            assertEquals(1L, response.getDonorId());
            assertEquals("Donor User", response.getDonorName());
            assertEquals(100L, response.getBookId());
            assertEquals("Catalog Book", response.getBookTitle());
            assertEquals("GOOD", response.getCondition());
            assertEquals("AVAILABLE", response.getStatus());
        }
    }

    @Test
    void createDonation_customBook_success() {
        User user = User.builder().id(1L).fullName("Donor User").build();
        DonationRequestDto dto = DonationRequestDto.builder()
                .customTitle("Custom Title")
                .customAuthor("Custom Author")
                .condition("FAIR")
                .description("A bit worn")
                .build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(donationRepository.save(any(Donation.class))).thenAnswer(i -> {
                Donation d = i.getArgument(0);
                d.setId(11L);
                return d;
            });

            DonationResponseDto response = donationService.createDonation(dto);

            assertNotNull(response);
            assertEquals(11L, response.getId());
            assertNull(response.getBookId());
            assertEquals("Custom Title", response.getCustomTitle());
            assertEquals("Custom Author", response.getCustomAuthor());
            assertEquals("FAIR", response.getCondition());
        }
    }

    @Test
    void getAvailableDonations_success() {
        User user = User.builder().id(1L).build();
        User donor = User.builder().id(2L).fullName("Bob").build();
        Donation d1 = Donation.builder().id(10L).donor(donor).condition("GOOD").status("AVAILABLE").build();
        Pageable pageable = PageRequest.of(0, 10);
        Page<Donation> page = new PageImpl<>(Arrays.asList(d1));

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(donationRepository.findAvailableDonations(1L, pageable)).thenReturn(page);

            Page<DonationResponseDto> response = donationService.getAvailableDonations(pageable);

            assertEquals(1, response.getTotalElements());
            assertEquals(10L, response.getContent().get(0).getId());
        }
    }

    @Test
    void getDonationDetails_success() {
        User donor = User.builder().id(2L).fullName("Bob").build();
        Donation donation = Donation.builder().id(10L).donor(donor).condition("GOOD").status("AVAILABLE").build();
        when(donationRepository.findById(10L)).thenReturn(Optional.of(donation));

        DonationResponseDto response = donationService.getDonationDetails(10L);

        assertEquals(10L, response.getId());
    }

    @Test
    void getDonationDetails_notFound_throws() {
        when(donationRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> donationService.getDonationDetails(999L));
    }

    @Test
    void requestDonation_success() {
        User recipient = User.builder().id(1L).fullName("Recipient User").build();
        User donor = User.builder().id(2L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("AVAILABLE").customTitle("Test").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(recipient);
            when(donationRepository.findById(10L)).thenReturn(Optional.of(donation));
            when(requestRepository.findByDonationIdAndRecipientId(10L, 1L)).thenReturn(Optional.empty());
            when(requestRepository.save(any(DonationRequest.class))).thenAnswer(i -> {
                DonationRequest req = i.getArgument(0);
                req.setId(100L);
                return req;
            });

            DonationRequestResponseDto response = donationService.requestDonation(10L, "I want to read this book");

            assertNotNull(response);
            assertEquals(100L, response.getId());
            assertEquals(1L, response.getRecipientId());
            assertEquals("PENDING", response.getStatus());
        }
    }

    @Test
    void requestDonation_ownDonation_throws() {
        User donor = User.builder().id(2L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("AVAILABLE").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(donor);
            when(donationRepository.findById(10L)).thenReturn(Optional.of(donation));

            assertThrows(IllegalArgumentException.class, () -> donationService.requestDonation(10L, "Reason"));
        }
    }

    @Test
    void requestDonation_notAvailable_throws() {
        User recipient = User.builder().id(1L).build();
        User donor = User.builder().id(2L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("MATCHED").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(recipient);
            when(donationRepository.findById(10L)).thenReturn(Optional.of(donation));

            assertThrows(IllegalArgumentException.class, () -> donationService.requestDonation(10L, "Reason"));
        }
    }

    @Test
    void requestDonation_alreadyRequested_throws() {
        User recipient = User.builder().id(1L).build();
        User donor = User.builder().id(2L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("AVAILABLE").build();
        DonationRequest existing = DonationRequest.builder().id(5L).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(recipient);
            when(donationRepository.findById(10L)).thenReturn(Optional.of(donation));
            when(requestRepository.findByDonationIdAndRecipientId(10L, 1L)).thenReturn(Optional.of(existing));

            assertThrows(IllegalArgumentException.class, () -> donationService.requestDonation(10L, "Reason"));
        }
    }

    @Test
    void getRequestsForDonation_success() {
        User donor = User.builder().id(2L).build();
        User recipient = User.builder().id(1L).fullName("Alice").build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("AVAILABLE").build();
        DonationRequest req = DonationRequest.builder().id(100L).donation(donation).recipient(recipient).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(donor);
            when(donationRepository.findById(10L)).thenReturn(Optional.of(donation));
            when(requestRepository.findByDonationId(10L)).thenReturn(Arrays.asList(req));

            List<DonationRequestResponseDto> response = donationService.getRequestsForDonation(10L);

            assertEquals(1, response.size());
            assertEquals(100L, response.get(0).getId());
        }
    }

    @Test
    void getRequestsForDonation_notDonor_throws() {
        User otherUser = User.builder().id(3L).build();
        User donor = User.builder().id(2L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("AVAILABLE").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(otherUser);
            when(donationRepository.findById(10L)).thenReturn(Optional.of(donation));

            assertThrows(SecurityException.class, () -> donationService.getRequestsForDonation(10L));
        }
    }

    @Test
    void approveRequest_success() {
        User donor = User.builder().id(2L).build();
        User recipient1 = User.builder().id(1L).build();
        User recipient2 = User.builder().id(3L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("AVAILABLE").build();

        DonationRequest req1 = DonationRequest.builder().id(100L).donation(donation).recipient(recipient1).status("PENDING").build();
        DonationRequest req2 = DonationRequest.builder().id(101L).donation(donation).recipient(recipient2).status("PENDING").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(donor);
            when(requestRepository.findById(100L)).thenReturn(Optional.of(req1));
            when(requestRepository.findByDonationId(10L)).thenReturn(Arrays.asList(req1, req2));

            donationService.approveRequest(100L);

            assertEquals("APPROVED", req1.getStatus());
            assertEquals("REJECTED", req2.getStatus());
            assertEquals("MATCHED", donation.getStatus());

            verify(requestRepository, times(2)).save(any(DonationRequest.class));
            verify(donationRepository).save(donation);
        }
    }

    @Test
    void approveRequest_notDonor_throws() {
        User other = User.builder().id(3L).build();
        User donor = User.builder().id(2L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("AVAILABLE").build();
        DonationRequest req = DonationRequest.builder().id(100L).donation(donation).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(other);
            when(requestRepository.findById(100L)).thenReturn(Optional.of(req));

            assertThrows(SecurityException.class, () -> donationService.approveRequest(100L));
        }
    }

    @Test
    void approveRequest_alreadyMatched_throws() {
        User donor = User.builder().id(2L).build();
        Donation donation = Donation.builder().id(10L).donor(donor).status("MATCHED").build();
        DonationRequest req = DonationRequest.builder().id(100L).donation(donation).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(donor);
            when(requestRepository.findById(100L)).thenReturn(Optional.of(req));

            assertThrows(IllegalArgumentException.class, () -> donationService.approveRequest(100L));
        }
    }

    @Test
    void getDonorDonations_success() {
        User user = User.builder().id(1L).build();
        Donation d = Donation.builder().id(10L).donor(user).condition("GOOD").status("AVAILABLE").build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(donationRepository.findByDonorId(1L)).thenReturn(Arrays.asList(d));

            List<DonationResponseDto> response = donationService.getDonorDonations();

            assertEquals(1, response.size());
            assertEquals(10L, response.get(0).getId());
        }
    }

    @Test
    void getRecipientRequests_success() {
        User user = User.builder().id(1L).build();
        Donation donation = Donation.builder().id(10L).donor(User.builder().id(2L).build()).status("AVAILABLE").build();
        DonationRequest req = DonationRequest.builder().id(100L).donation(donation).recipient(user).build();

        try (MockedStatic<AuthUtils> auth = mockStatic(AuthUtils.class)) {
            auth.when(() -> AuthUtils.getCurrentUser(userRepository)).thenReturn(user);
            when(requestRepository.findByRecipientId(1L)).thenReturn(Arrays.asList(req));

            List<DonationRequestResponseDto> response = donationService.getRecipientRequests();

            assertEquals(1, response.size());
            assertEquals(100L, response.get(0).getId());
        }
    }
}
