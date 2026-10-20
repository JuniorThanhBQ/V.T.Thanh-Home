package com.vtthanh.V.T.Thanh_Home_SpringBoot.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.Objects;

@Entity
@Table(name = "chat_messages")
public class ChatMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_session_id", nullable = false)
    private ChatSession chatSession;

    @Column(name = "input", nullable = false, columnDefinition = "TEXT")
    private String input;

    @Column(name = "output", nullable = false, columnDefinition = "TEXT")
    private String output;

    @OneToOne(mappedBy = "chatMessage", cascade = CascadeType.ALL, orphanRemoval = true)
    private LogChatHistory logChatHistory;

    @Column(name = "request_id", length = 64)
    private String requestId;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "COMPLETED";

    public String getRequestId() {
        return requestId;
    }
    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }
    public String getStatus() {
        return status;
    }
    public void setStatus(String status) {
        this.status = status;
    }

    protected ChatMessage() {
    }

    public ChatMessage(ChatSession chatSession, String input, String output) {
        this.chatSession = chatSession;
        this.input = input;
        this.output = output;
    }

    public ChatSession getChatSession() {
        return chatSession;
    }

    public void setChatSession(ChatSession chatSession) {
        this.chatSession = chatSession;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public LogChatHistory getLogChatHistory() {
        return logChatHistory;
    }

    public void setLogChatHistory(LogChatHistory logChatHistory) {
        this.logChatHistory = logChatHistory;
        if (logChatHistory != null) {
            logChatHistory.setChatMessage(this);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ChatMessage that = (ChatMessage) o;
        return getId() != null && Objects.equals(getId(), that.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
