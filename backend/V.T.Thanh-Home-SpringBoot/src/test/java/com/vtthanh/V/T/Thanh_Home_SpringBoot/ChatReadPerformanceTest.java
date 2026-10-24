package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.ChatMessageRequest;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ChatMessage;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.ChatSession;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.LogChatHistory;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Visitor;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.ChatMessageRepository;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.ChatService;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.GroqChatClient;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ContextConfiguration(initializers = SafeTestDatabaseInitializer.class)
@SpringBootTest(properties = "spring.jpa.properties.hibernate.session_factory.statement_inspector=com.vtthanh.V.T.Thanh_Home_SpringBoot.ChatReadPerformanceTest$SqlCapture")
@Transactional
public class ChatReadPerformanceTest {

    @PersistenceContext
    private EntityManager entityManager;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private ChatMessageRepository messages;
    @Autowired
    private ChatService chat;
    @MockitoBean
    private GroqChatClient client;

    private Long sessionId;
    private Long visitorId;
    private String token;

    @BeforeEach
    void seedHistory() {
        Visitor visitor = new Visitor(UUID.randomUUID(), "127.0.0.1");
        entityManager.persist(visitor);
        visitorId = visitor.getId();
        ChatSession session = new ChatSession("127.0.0.1", "query-count-test");
        session.setVisitor(visitor);
        entityManager.persist(session);
        sessionId = session.getId();
        token = session.getSessionToken();
        for (int i = 0; i < 55; i++) {
            ChatMessage message = persistMessage(session, "question-" + i, "answer-" + i, i);
            if (i != 53) {
                entityManager.persist(new LogChatHistory(message, 10, 20, false, "test-provider"));
            }
        }
        persistMessage(session, "failed", "", 100).setStatus("FAILED");
        ChatSession other = new ChatSession("127.0.0.1", "other-session");
        other.setVisitor(visitor);
        entityManager.persist(other);
        persistMessage(other, "other-question", "other-answer", 101);
        entityManager.flush();
        entityManager.clear();
    }

    private ChatMessage persistMessage(ChatSession session, String input, String output, int position) {
        ChatMessage message = new ChatMessage(session, input, output);
        entityManager.persist(message);
        entityManager.flush();
        jdbc.update("update chat_messages set created_date = ? where id = ?",
                Timestamp.from(Instant.parse("2026-01-01T00:00:00Z").plusSeconds(position)), message.getId());
        return message;
    }

    @ParameterizedTest
    @ValueSource(ints = {3, 50})
    void boundedProjectionUsesOneQueryWithoutLoadingLogs(int limit) {
        ChatSession session = entityManager.getReference(ChatSession.class, sessionId);
        List<String> sql = SqlCapture.start();
        try {
            var history = messages.findHistoryByChatSessionAndStatus(session, "COMPLETED", PageRequest.of(0, limit));
            assertThat(history).hasSize(limit);
            assertThat(history).extracting(item -> item.input()).containsExactlyElementsOf(
                    IntStream.range(0, limit).mapToObj(i -> "question-" + (54 - i)).toList());
            assertThat(history).extracting(item -> item.output()).containsExactlyElementsOf(
                    IntStream.range(0, limit).mapToObj(i -> "answer-" + (54 - i)).toList());
            assertThat(history.getFirst().timestamp()).isEqualTo(Instant.parse("2026-01-01T00:00:54Z"));
            assertThat(sql).hasSize(1);
            assertThat(sql.getFirst()).contains("chat_messages").doesNotContain("log_chat_history");
        } finally {
            SqlCapture.stop();
        }
    }

    @Test
    void serviceHistoryUsesTwoQueriesAndPreservesChronologicalOrder() {
        List<String> sql = SqlCapture.start();
        try {
            var history = chat.getSessionHistory(token, visitorId);
            assertThat(history).hasSize(50);
            assertThat(history).extracting(item -> item.input()).containsExactlyElementsOf(
                    IntStream.range(5, 55).mapToObj(i -> "question-" + i).toList());
            assertThat(sql).hasSize(2);
            assertThat(sql).allSatisfy(statement -> assertThat(statement).doesNotContain("log_chat_history"));
        } finally {
            SqlCapture.stop();
        }
    }

    @Test
    void generationUsesOnlyThreeLatestCompletedPairsInChronologicalOrder() {
        List<Map<String, String>> expected = new ArrayList<>();
        for (int i = 52; i < 55; i++) {
            expected.add(Map.of("role", "user", "content", "question-" + i));
            expected.add(Map.of("role", "assistant", "content", "answer-" + i));
        }
        when(client.generateResponse(anyString(), anyList(), anyString()))
                .thenReturn(new GroqChatClient.LlmResult("reply", 10, 20, "test-provider"));
        var response = chat.sendMessage(new ChatMessageRequest("Hello", UUID.randomUUID().toString(), null), visitorId, token);
        assertThat(response.reply()).isEqualTo("reply");
        verify(client).generateResponse(anyString(), org.mockito.ArgumentMatchers.eq(expected), org.mockito.ArgumentMatchers.eq("Hello"));
    }

    public static class SqlCapture implements StatementInspector {
        private static final ThreadLocal<List<String>> STATEMENTS = new ThreadLocal<>();

        static List<String> start() {
            List<String> statements = new ArrayList<>();
            STATEMENTS.set(statements);
            return statements;
        }

        static void stop() {
            STATEMENTS.remove();
        }

        @Override
        public String inspect(String sql) {
            List<String> statements = STATEMENTS.get();
            if (statements != null) {
                statements.add(sql);
            }
            return sql;
        }
    }
}
