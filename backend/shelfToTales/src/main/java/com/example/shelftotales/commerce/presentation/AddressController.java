package com.example.shelftotales.commerce.presentation;
import com.example.shelftotales.commerce.infrastructure.*;
import com.example.shelftotales.commerce.domain.*;
import com.example.shelftotales.commerce.application.*;

import com.example.shelftotales.auth.domain.User;
import com.example.shelftotales.auth.infrastructure.UserRepository;
import com.example.shelftotales.shared.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final ShippingAddressRepository addressRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<ShippingAddress>> getAll() {
        User user = AuthUtils.getCurrentUser(userRepository);
        return ResponseEntity.ok(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<ShippingAddress> create(@RequestBody Map<String, String> body) {
        User user = AuthUtils.getCurrentUser(userRepository);
        ShippingAddress address = ShippingAddress.builder()
                .user(user)
                .fullName(body.get("fullName"))
                .phone(body.get("phone"))
                .addressLine(body.get("addressLine"))
                .city(body.get("city"))
                .area(body.get("area"))
                .postalCode(body.get("postalCode"))
                .isDefault("true".equals(body.get("isDefault")))
                .build();
        return ResponseEntity.ok(addressRepository.save(address));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = AuthUtils.getCurrentUser(userRepository);
        ShippingAddress address = addressRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        if (!address.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized");
        }
        addressRepository.delete(address);
        return ResponseEntity.ok().build();
    }
}
