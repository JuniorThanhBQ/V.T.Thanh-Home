package com.vtthanh.V.T.Thanh_Home_SpringBoot.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "log_chat_history")
public class LogChatHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_message_id", nullable = false, unique = true)
    private ChatMessage chatMessage;

    @Column(name = "latency", nullable = false)
    private int latency = 0;

    @Column(name = "token_used", nullable = false)
    private int tokenUsed = 0;

    @Column(name = "content_violation", nullable = false)
    private boolean contentViolation = false;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "created_date", nullable = false, updatable = false)
    private Instant createdDate;

    @PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = Instant.now();
        }
    }

    protected LogChatHistory() {
    }

    public LogChatHistory(ChatMessage chatMessage, int latency, int tokenUsed, boolean contentViolation, String model) {
        this.chatMessage = chatMessage;
        this.latency = latency;
        this.tokenUsed = tokenUsed;
        this.contentViolation = contentViolation;
        this.model = model;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ChatMessage getChatMessage() {
        return chatMessage;
    }

    public void setChatMessage(ChatMessage chatMessage) {
        this.chatMessage = chatMessage;
    }

    public int getLatency() {
        return latency;
    }

    public void setLatency(int latency) {
        this.latency = latency;
    }

    public int getTokenUsed() {
        return tokenUsed;
    }

    public void setTokenUsed(int tokenUsed) {
        this.tokenUsed = tokenUsed;
    }

    public boolean isContentViolation() {
        return contentViolation;
    }

    public void setContentViolation(boolean contentViolation) {
        this.contentViolation = contentViolation;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Instant getCreatedDate() {
        return createdDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        LogChatHistory that = (LogChatHistory) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
