package com.vtthanh.V.T.Thanh_Home_SpringBoot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "visitors")
public class Visitor extends BaseEntity {

    @Column(name = "visitor_token", nullable = false, unique = true, updatable = false)
    private UUID visitorToken;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "is_blocked", nullable = false)
    private boolean blocked = false;

    @Column(name = "blocked_at")
    private Instant blockedAt;

    @Column(name = "block_reason", length = 255)
    private String blockReason;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @Column(name = "language", length = 40)
    private String language;

    @Column(name = "time_zone", length = 100)
    private String timeZone;

    public void setMetadata(String userAgent, String language, String timeZone) {
        this.userAgent = userAgent;
        this.language = language;
        this.timeZone = timeZone;
    }

    protected Visitor() {
    }

    public Visitor(UUID visitorToken, String ipAddress) {
        this.visitorToken = visitorToken;
        this.ipAddress = ipAddress;
        this.blocked = false;
        this.lastSeenAt = Instant.now();
    }

    public UUID getVisitorToken() {
        return visitorToken;
    }

    public void setVisitorToken(UUID visitorToken) {
        this.visitorToken = visitorToken;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    public Instant getBlockedAt() {
        return blockedAt;
    }

    public void setBlockedAt(Instant blockedAt) {
        this.blockedAt = blockedAt;
    }

    public String getBlockReason() {
        return blockReason;
    }

    public void setBlockReason(String blockReason) {
        this.blockReason = blockReason;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    public void updateLastSeen() {
        this.lastSeenAt = Instant.now();
    }

    public void block(String reason) {
        this.blocked = true;
        this.blockedAt = Instant.now();
        this.blockReason = reason;
    }

    public void unblock() {
        this.blocked = false;
        this.blockedAt = null;
        this.blockReason = null;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Visitor visitor = (Visitor) o;
        return Objects.equals(visitorToken, visitor.visitorToken);
    }

    @Override
    public int hashCode() {
        return Objects.hash(visitorToken);
    }
}
