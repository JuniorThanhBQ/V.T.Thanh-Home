package com.vtthanh.V.T.Thanh_Home_SpringBoot.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "chat_sessions")
public class ChatSession extends BaseEntity {

    @Column(name = "session_token", nullable = false, unique = true, length = 64)
    private String sessionToken;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 300)
    private String userAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "visitor_id")
    private Visitor visitor;

    public Visitor getVisitor() {
        return visitor;
    }

    public void setVisitor(Visitor visitor) {
        this.visitor = visitor;
    }

    @OneToMany(mappedBy = "chatSession", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdDate ASC")
    private List<ChatMessage> messages = new ArrayList<>();

    protected ChatSession() {
    }

    public ChatSession(String ipAddress, String userAgent) {
        this.sessionToken = UUID.randomUUID().toString();
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public List<ChatMessage> getMessages() {
        return messages;
    }

    public void addMessage(ChatMessage message) {
        message.setChatSession(this);
        this.messages.add(message);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ChatSession that = (ChatSession) o;
        return Objects.equals(sessionToken, that.sessionToken);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sessionToken);
    }
}
