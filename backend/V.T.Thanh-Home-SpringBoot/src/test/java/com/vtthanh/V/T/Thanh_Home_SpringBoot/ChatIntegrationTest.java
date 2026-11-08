package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.*;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.*;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.VisitorRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@org.springframework.test.context.ContextConfiguration(initializers = SafeTestDatabaseInitializer.class)
@SpringBootTest
class ChatIntegrationTest {
    @Autowired private WebApplicationContext context;
    @Autowired private VisitorService visitors;
    @Autowired private VisitorRepository visitorRepository;
    @Autowired private ChatMessageRepository messages;
    @Autowired private ChatSessionRepository sessions;
    @Autowired private LogChatHistoryRepository logs;
    @MockitoBean private GroqChatClient client;
    @MockitoBean private GeminiSpeechService speech;
    private MockMvc mvc;
    private MockHttpSession owner;

    @BeforeEach
    void setup() {
        logs.deleteAll();
        messages.deleteAll();
        sessions.deleteAll();
        owner = visitor();
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        when(client.generateResponse(anyString(), anyList(), anyString())).thenAnswer(invocation -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return new GroqChatClient.LlmResult("Thanh builds software with Spring Boot and Angular.", 18, 20, "test-provider");
        });
    }

    private MockHttpSession visitor() {
        var request = new MockHttpServletRequest();
        request.setSession(new MockHttpSession());
        visitors.register(request, new VisitorRequest("en", "UTC"));
        return (MockHttpSession) request.getSession();
    }

    private MvcResult send(String body, MockHttpSession session) throws Exception {
        return mvc.perform(post("/api/v1/chat/message").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.*", org.hamcrest.Matchers.hasSize(3)))
                .andExpect(jsonPath("$.messageId").isNumber())
                .andExpect(jsonPath("$.reply").isString())
                .andExpect(jsonPath("$.timestamp").isString())
                .andExpect(jsonPath("$.sessionToken").doesNotExist())
                .andExpect(jsonPath("$.tokensUsed").doesNotExist())
                .andExpect(jsonPath("$.latencyMs").doesNotExist()).andReturn();
    }

    @Test
    void startingSessionStoresOnlyTheServerGeneratedToken() throws Exception {
        mvc.perform(post("/api/v1/chat/session").session(owner).with(csrf())
                .header("User-Agent", "untrusted-client-metadata")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isNoContent()).andExpect(content().string(""));
        String token = (String) owner.getAttribute("CHAT_TOKEN");
        assertThat(java.util.UUID.fromString(token).toString()).isEqualTo(token);
        assertThat(owner.getAttribute("CHAT_TOKEN")).isEqualTo(token);
        assertThat(sessions.findAll().getFirst().getSessionToken()).isEqualTo(token);
        assertThat(token).isNotEqualTo("client-chosen-token").isNotEqualTo("untrusted-client-metadata");
    }

    @Test
    void successfulMessageUsesOwnedSessionAndRecordsActualUsage() throws Exception {
        var result = send("{\"message\":\"What are Thanh's skills?\",\"requestId\":\"success\"}", owner);
        String token = (String) owner.getAttribute("CHAT_TOKEN");
        assertThat(java.util.UUID.fromString(token).toString()).isEqualTo(token);
        assertThat(owner.getAttribute("CHAT_TOKEN")).isEqualTo(token);
        assertThat(sessions.findAll().getFirst().getSessionToken()).isEqualTo(token);
        assertThat(JsonPath.<String>read(result.getResponse().getContentAsString(), "$.reply")).contains("Spring Boot");
        assertThat(messages.count()).isEqualTo(1);
        assertThat(logs.findAll().getFirst().getTokenUsed()).isEqualTo(18);
        assertThat(logs.findAll().getFirst().getLatency()).isEqualTo(20);
        mvc.perform(get("/api/v1/chat/history").session(owner))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].output").value("Thanh builds software with Spring Boot and Angular."));
        verify(client).generateResponse(anyString(), anyList(), anyString());
    }

    @Test
    void duplicateRequestDoesNotCallProviderTwice() throws Exception {
        String body = "{\"message\":\"Hello Thanh\",\"requestId\":\"same-request\"}";
        send(body, owner);
        send(body, owner);
        verify(client, times(1)).generateResponse(anyString(), anyList(), anyString());
        assertThat(messages.count()).isEqualTo(1);
    }

    @Test
    void anotherVisitorCannotReadOrWriteConversationEvenWithItsToken() throws Exception {
        send("{\"message\":\"Hello\",\"requestId\":\"owned\"}", owner);
        String token = (String) owner.getAttribute("CHAT_TOKEN");
        MockHttpSession other = visitor();
        mvc.perform(get("/api/v1/chat/history").session(other)).andExpect(status().isNotFound());
        other.setAttribute("CHAT_TOKEN", token);
        mvc.perform(get("/api/v1/chat/history").session(other)).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/chat/message").session(other).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"Hello\",\"requestId\":\"stolen\"}"))
                .andExpect(status().isNotFound());
        assertThat(messages.count()).isEqualTo(1);
        verify(client, times(1)).generateResponse(anyString(), anyList(), anyString());
    }

    @Test
    void legacyConversationSelectorsAreRejectedWithoutCreatingWork() throws Exception {
        for (String token : List.of("\"client-chosen-token\"", "null")) {
            mvc.perform(post("/api/v1/chat/session").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"sessionToken\":" + token + "}"))
                    .andExpect(status().isBadRequest());
            mvc.perform(post("/api/v1/chat/message").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"sessionToken\":" + token + ",\"message\":\"Hello\",\"requestId\":\"legacy\"}"))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/v1/chat/history").session(owner).param("sessionToken", ""))
                .andExpect(status().isBadRequest());
        assertThat(owner.getAttribute("CHAT_TOKEN")).isNull();
        assertThat(sessions.count()).isZero();
        assertThat(messages.count()).isZero();
        verifyNoInteractions(client);
    }

    @Test
    void messageIdCannotSelectAnotherVisitorsHistory() throws Exception {
        var result = send("{\"message\":\"Hello\",\"requestId\":\"owned-id\"}", owner);
        Number id = JsonPath.read(result.getResponse().getContentAsString(), "$.messageId");
        MockHttpSession other = visitor();
        mvc.perform(get("/api/v1/chat/history").session(other).param("id", id.toString()))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/chat/history").param("id", id.toString()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/chat/messages/" + id).session(other))
                .andExpect(status().isNotFound());
    }

    @Test
    void failedProviderReturns503AndIsNotRecordedAsSuccessfulResponse() throws Exception {
        when(client.generateResponse(anyString(), anyList(), anyString()))
                .thenThrow(new com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException("Assistant unavailable"));
        mvc.perform(post("/api/v1/chat/message").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"Hello\",\"requestId\":\"unavailable\"}"))
                .andExpect(status().isServiceUnavailable());
        assertThat(messages.findAll().getFirst().getStatus()).isEqualTo("FAILED");
        assertThat(logs.count()).isZero();
    }

    @Test
    void unregisteredAndCsrfFreeRequestsAreRejected() throws Exception {
        mvc.perform(post("/api/v1/chat/message").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"Hello\",\"requestId\":\"anonymous\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/chat/message").session(owner).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void blockedVisitorCannotStartGeneration() throws Exception {
        Long id = (Long) owner.getAttribute("VISITOR_ID");
        var record = visitorRepository.findById(id).orElseThrow();
        record.block("test");
        visitorRepository.save(record);
        mvc.perform(post("/api/v1/chat/message").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"message\":\"Hello\",\"requestId\":\"blocked\"}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(client);
    }

    @Test
    void streamsDeltasThenPersistsBeforeDoneAndReplaysWithoutGeneration() throws Exception {
        when(client.streamResponse(anyString(), anyList(), anyString(), any())).thenAnswer(invocation -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            java.util.function.Consumer<String> delta = invocation.getArgument(3);
            delta.accept("Hello ");
            delta.accept("Thanh");
            return new GroqChatClient.LlmResult("Hello Thanh", 18, 20, "test-provider");
        });
        String body = "{\"message\":\"Tell me about Thanh\",\"requestId\":\"stream-success\"}";
        for (int attempt = 0; attempt < 2; attempt++) {
            var pending = mvc.perform(post("/api/v1/chat/message/stream").session(owner).with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(request().asyncStarted()).andReturn();
            pending.getAsyncResult(5000);
            var result = mvc.perform(asyncDispatch(pending)).andExpect(status().isOk()).andReturn();
            String stream = result.getResponse().getContentAsString();
            assertThat(stream).contains("event:start", "event:done", "Hello Thanh");
            if (attempt == 0) {
                assertThat(stream).contains("event:delta", "Hello ");
            }
            assertThat(messages.findAll()).hasSize(1);
            assertThat(messages.findAll().getFirst().getStatus()).isEqualTo("COMPLETED");
        }
        verify(client, times(1)).streamResponse(anyString(), anyList(), anyString(), any());
    }

    @Test
    void interruptedProviderCanRetrySameRequestWithoutDuplicateMessage() throws Exception {
        when(client.streamResponse(anyString(), anyList(), anyString(), any()))
                .thenThrow(new org.springframework.web.client.ResourceAccessException("interrupted"))
                .thenReturn(new GroqChatClient.LlmResult("Recovered", 1, 1, "test-provider"));
        String body = "{\"message\":\"Tell me about Thanh\",\"requestId\":\"stream-retry\"}";
        for (int attempt = 0; attempt < 2; attempt++) {
            var pending = mvc.perform(post("/api/v1/chat/message/stream").session(owner).with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andReturn();
            pending.getAsyncResult(5000);
            String stream = mvc.perform(asyncDispatch(pending)).andReturn().getResponse().getContentAsString();
            assertThat(stream).contains(attempt == 0 ? "event:error" : "event:done");
            assertThat(messages.findAll()).hasSize(1);
            assertThat(messages.findAll().getFirst().getStatus()).isEqualTo(attempt == 0 ? "FAILED" : "COMPLETED");
        }
    }

    @Test
    void streamStillRequiresCsrfAndVisitorRegistration() throws Exception {
        mvc.perform(post("/api/v1/chat/message/stream").session(owner)
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/chat/message/stream").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void speechStreamRequiresCsrfAndAnOwnedCompletedReply() throws Exception {
        send("{\"message\":\"Hello\",\"requestId\":\"owned-speech\"}", owner);
        String path = "/api/v1/chat/speech/owned-speech/stream";
        MockHttpSession other = visitor();
        other.setAttribute("CHAT_TOKEN", owner.getAttribute("CHAT_TOKEN"));
        mvc.perform(post(path).session(owner)).andExpect(status().isForbidden());
        mvc.perform(post(path).with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post(path).session(other).with(csrf())).andExpect(status().isNotFound());
        var message = messages.findAll().getFirst();
        message.setStatus("PROCESSING");
        messages.save(message);
        mvc.perform(post(path).session(owner).with(csrf())).andExpect(status().isNotFound());
        verifyNoInteractions(speech);
        message.setStatus("COMPLETED");
        messages.save(message);
        doAnswer(invocation -> {
            java.util.function.Consumer<byte[]> output = invocation.getArgument(2);
            output.accept(new byte[] {0, 1, 2, 3});
            return null;
        }).when(speech).stream(anyString(), anyString(), any());
        var pending = mvc.perform(post(path).session(owner).with(csrf())
                .accept(MediaType.TEXT_EVENT_STREAM, MediaType.APPLICATION_JSON))
                .andExpect(request().asyncStarted()).andReturn();
        pending.getAsyncResult(5000);
        var result = mvc.perform(asyncDispatch(pending)).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "private, no-store, no-transform")).andReturn();
        assertThat(result.getResponse().getContentAsString())
                .contains("\"type\":\"start\"", "\"type\":\"audio\"", "\"data\":\"AAECAw==\"", "\"type\":\"done\"");
        verify(speech).stream(anyString(), eq(message.getOutput()), any());
    }
}
