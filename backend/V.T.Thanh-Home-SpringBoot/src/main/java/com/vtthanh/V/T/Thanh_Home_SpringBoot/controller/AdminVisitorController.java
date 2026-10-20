package com.vtthanh.V.T.Thanh_Home_SpringBoot.controller;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Visitor;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.VisitorRepository;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ResourceNotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminVisitorController {
    private final VisitorRepository visitors;

    public AdminVisitorController(VisitorRepository visitors) {
        this.visitors = visitors;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Summary> list(@RequestParam(defaultValue = "0") int page) {
        return visitors.findAll(PageRequest.of(Math.max(0, Math.min(page, 1000)), 50, Sort.by("id").descending()))
                .map(this::summary).getContent();
    }

    @PatchMapping("/{id}/block")
    @Transactional
    public Summary block(@PathVariable Long id, @RequestBody BlockChange change) {
        Visitor visitor = visitors.findById(id).orElseThrow(() -> new ResourceNotFoundException("Visitor not found"));
        if (change.reason() != null && change.reason().length() > 255) {
            throw new IllegalArgumentException("Block reason is too long");
        }
        if (change.blocked()) {
            visitor.block(change.reason());
        } else {
            visitor.unblock();
        }
        visitors.save(visitor);
        return summary(visitor);
    }

    private Summary summary(Visitor visitor) {
        return new Summary(visitor.getId(), visitor.isBlocked(), visitor.getLastSeenAt());
    }

    public record Summary(Long id, boolean blocked, Instant lastSeenAt) { }
    public record BlockChange(boolean blocked, String reason) { }
}
