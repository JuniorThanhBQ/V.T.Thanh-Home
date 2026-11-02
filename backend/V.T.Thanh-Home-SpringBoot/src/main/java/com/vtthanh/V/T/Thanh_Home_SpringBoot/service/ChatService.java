package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.*;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.*;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ResourceNotFoundException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;

@Service
public class ChatService {

    private final ChatSessionRepository sessions;
    private final ChatMessageRepository messages;
    private final LogChatHistoryRepository logs;
    private final VisitorRepository visitors;
    private final ChatPromptService prompts;
    private final GroqChatClient client;
    private final ChatRateLimiterService limiter;
    private final TransactionTemplate transactions;
    private java.time.LocalDate budgetDay = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
    private int generationsToday;
    private final int dailyLimit;
    private final Semaphore capacity = new Semaphore(2);
    private final Set<Long> activeVisitors = ConcurrentHashMap.newKeySet();

    public ChatService(ChatSessionRepository sessions, ChatMessageRepository messages,
            LogChatHistoryRepository logs, VisitorRepository visitors, ChatPromptService prompts,
            GroqChatClient client, ChatRateLimiterService limiter, PlatformTransactionManager manager, @org.springframework.beans.factory.annotation.Value("${app.chat.daily-generation-limit:200}") int dailyLimit) {
        this.dailyLimit = dailyLimit;
        this.sessions = sessions;
        this.messages = messages;
        this.logs = logs;
        this.visitors = visitors;
        this.prompts = prompts;
        this.client = client;
        this.limiter = limiter;
        this.transactions = new TransactionTemplate(manager);
    }

    public String startNewSession(Long visitorId, String ip, String userAgent) {
        return transactions.execute(tx -> {
            ChatSession session = new ChatSession(ip, VisitorService.bounded(userAgent, 300));
            session.setVisitor(visitors.getReferenceById(visitorId));
            sessions.save(session);
            return session.getSessionToken();
        });
    }

    public ChatMessageResponse sendMessage(ChatMessageRequest request, Long visitorId, String token) {
        return sendMessage(request, visitorId, token, null);
    }

    public void validateStream(ChatMessageRequest request, Long visitorId, String token) {
        validateMessage(request);
        transactions.executeWithoutResult(tx -> ownedSession(token, visitorId));
    }

    private void validateMessage(ChatMessageRequest request) {
        if (request == null || request.message() == null || request.message().isBlank()
                || request.message().trim().length() > 1000) {
            throw new IllegalArgumentException("Message must contain between 1 and 1000 characters");
        }
        if (request.requestId() == null || !request.requestId().matches("[a-zA-Z0-9_-]{1,64}")) {
            throw new IllegalArgumentException("A valid request ID is required");
        }
    }

    public ChatMessageResponse sendMessage(ChatMessageRequest request, Long visitorId, String token, java.util.function.Consumer<String> delta) {
        return sendMessage(request, visitorId, token, delta, stage -> { });
    }

    public ChatMessageResponse sendMessage(ChatMessageRequest request, Long visitorId, String token, java.util.function.Consumer<String> delta, java.util.function.Consumer<String> status) {
        validateMessage(request);
        if (!activeVisitors.add(visitorId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A message is already in progress");
        }
        if (!capacity.tryAcquire()) {
            activeVisitors.remove(visitorId);
            throw new ServiceUnavailableException("The assistant is busy. Please try again shortly.");
        }
        Work work = null;
        try {
            status.accept("preparing");
            work = transactions.execute(tx -> prepare(request, visitorId, token));
            if (work.completed() != null) {
                return work.completed();
            }
            limiter.checkLimit("visitor:" + visitorId);
            String text = request.message().trim();
            boolean violation = prompts.detectPotentialViolation(text);
            if (!violation) {
                reserveGeneration();
                status.accept("generating");
            }
            GroqChatClient.LlmResult result = violation
                    ? new GroqChatClient.LlmResult("I can help with questions about Thanh's portfolio, skills and projects.", 0, 0, "policy")
                    : delta == null ? client.generateResponse(prompts.buildSystemPrompt(request.language()), work.history(), text)
                    : client.streamResponse(prompts.buildSystemPrompt(request.language()), work.history(), text, delta);
            if (Thread.currentThread().isInterrupted()) {
                throw new java.util.concurrent.CancellationException();
            }
            if (violation && delta != null) {
                delta.accept(result.content());
            }
            Work current = work;
            return transactions.execute(tx -> {
                ChatMessage message = messages.findById(current.messageId()).orElseThrow();
                message.setOutput(result.content());
                message.setStatus("COMPLETED");
                messages.save(message);
                logs.save(new LogChatHistory(message, (int) result.latencyMs(), result.tokensUsed(), violation, result.model()));
                return response(message);
            });
        } catch (RuntimeException ex) {
            if (work != null && work.completed() == null) {
                Long id = work.messageId();
                transactions.executeWithoutResult(tx -> messages.findById(id).ifPresent(message -> {
                    message.setStatus("FAILED");
                    messages.save(message);
                }));
            }
            if (ex instanceof org.springframework.web.client.RestClientException) {
                org.slf4j.LoggerFactory.getLogger(ChatService.class).warn("Assistant provider failed: type={}, status={}",
                        ex.getClass().getSimpleName(), ex instanceof org.springframework.web.client.RestClientResponseException http ? http.getStatusCode().value() : 0);
                throw new ServiceUnavailableException("The assistant provider is temporarily unavailable");
            }
            throw ex;
        } finally {
            capacity.release();
            activeVisitors.remove(visitorId);
        }
    }

    public List<ChatHistoryItemResponse> getSessionHistory(String token, Long visitorId) {
        return transactions.execute(tx -> {
            ChatSession session = ownedSession(token, visitorId);
            List<ChatHistoryItemResponse> history = new ArrayList<>(messages.findHistoryByChatSessionAndStatus(session, "COMPLETED", PageRequest.of(0, 50)));
            Collections.reverse(history);
            return List.copyOf(history);
        });
    }

    public String speechReply(String token, Long visitorId, String requestId) {
        if (requestId == null || !requestId.matches("[a-zA-Z0-9_-]{1,64}")) {
            throw new IllegalArgumentException("Invalid request ID");
        }
        return transactions.execute(tx -> {
            var session = ownedSession(token, visitorId);
            var message = messages.findByChatSessionAndRequestId(session, requestId)
                    .filter(item -> "COMPLETED".equals(item.getStatus()))
                    .orElseThrow(() -> new ResourceNotFoundException("Reply not found"));
            return message.getOutput();
        });
    }

    private Work prepare(ChatMessageRequest request, Long visitorId, String token) {
        ChatSession session = ownedSession(token, visitorId);
        var existing = messages.findByChatSessionAndRequestId(session, request.requestId());
        if (existing.isPresent()) {
            ChatMessage prior = existing.get();
            if (!prior.getInput().equals(request.message().trim()) || "PROCESSING".equals(prior.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Request ID already used");
            }
            if ("COMPLETED".equals(prior.getStatus())) {
                return new Work(prior.getId(), List.of(), response(prior));
            }
        }
        if (existing.isEmpty() && messages.countByChatSession(session) >= 60) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conversation limit reached. Start a new session.");
        }
        List<ChatHistoryItemResponse> history = new ArrayList<>(messages.findHistoryByChatSessionAndStatus(session, "COMPLETED", PageRequest.of(0, 3)));
        Collections.reverse(history);
        List<Map<String, String>> context = new ArrayList<>();
        for (ChatHistoryItemResponse prior : history) {
            context.add(Map.of("role", "user", "content", prior.input()));
            context.add(Map.of("role", "assistant", "content", prior.output()));
        }
        ChatMessage message = existing.orElseGet(() -> new ChatMessage(session, request.message().trim(), ""));
        message.setRequestId(request.requestId());
        message.setStatus("PROCESSING");
        messages.saveAndFlush(message);
        return new Work(message.getId(), context, null);
    }

    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 60000)
    public void recoverInterruptedMessages() {
        transactions.executeWithoutResult(tx -> messages.expireProcessing(java.time.Instant.now().minusSeconds(120)));
    }

    private synchronized void reserveGeneration() {
        var today = java.time.LocalDate.now(java.time.ZoneOffset.UTC);
        if (!today.equals(budgetDay)) {
            budgetDay = today;
            generationsToday = 0;
        }
        if (generationsToday >= dailyLimit) {
            throw new ServiceUnavailableException("The assistant has reached its daily capacity. Please use the contact form.");
        }
        generationsToday++;
    }

    private ChatSession ownedSession(String token, Long visitorId) {
        if (token == null || token.length() > 64) {
            throw new ResourceNotFoundException("Conversation not found");
        }
        ChatSession session = sessions.findBySessionToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        if (session.getVisitor() == null || !session.getVisitor().getId().equals(visitorId)) {
            throw new ResourceNotFoundException("Conversation not found");
        }
        return session;
    }

    private ChatMessageResponse response(ChatMessage message) {
        return new ChatMessageResponse(message.getId(), message.getOutput(), message.getCreatedDate());
    }

    private record Work(Long messageId, List<Map<String, String>> history, ChatMessageResponse completed) { }
}
