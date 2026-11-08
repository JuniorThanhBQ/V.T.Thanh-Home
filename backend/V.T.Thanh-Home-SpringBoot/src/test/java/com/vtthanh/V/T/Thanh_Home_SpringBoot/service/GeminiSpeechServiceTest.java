package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.PipedInputStream;
import java.io.PipedOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GeminiSpeechServiceTest {
    @Test
    void parsesArrayAndDeduplicatesKeys() {
        assertEquals(java.util.List.of("one", "two"), GeminiSpeechService.parseKeys("[\"one\",\"two\",\"one\"]"));
        assertTrue(GeminiSpeechService.parseKeys("").isEmpty());
    }

    @Test
    void wrapsPcmWithCorrectWavHeader() {
        byte[] wav = GeminiSpeechService.wav(new byte[] {0, 1, 2, 3});
        var buffer = ByteBuffer.wrap(wav).order(ByteOrder.LITTLE_ENDIAN);
        assertEquals(48, wav.length);
        assertEquals(24000, buffer.getInt(24));
        assertEquals(4, buffer.getInt(40));
        assertThrows(IllegalArgumentException.class, () -> GeminiSpeechService.wav(new byte[1]));
    }

    @Test
    void cleansMarkupWithoutChangingVietnameseText() {
        assertEquals("Xin chào portfolio", GeminiSpeechService.plainText("**Xin chào** [portfolio](https://example.com)\n```js\ncode()\n```"));
    }

    @Test
    void requestsAudioAndCachesReplay() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new GeminiSpeechService("[\"test-key\"]", "gemini-3.8-flash-lite-tts", "Kore", 1);
        ReflectionTestUtils.setField(service, "client", builder.build());
        server.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:generateContent"))
                .andExpect(header("x-goog-api-key", "test-key"))
                .andExpect(jsonPath("$.generationConfig.speechConfig.voiceConfig.voice").value("Kore"))
                .andExpect(jsonPath("$.contents[0].parts[0].text").value("Xin chào"))
                .andExpect(jsonPath("$.contents[0].parts[0].speech_metadata.style").value("natural and friendly"))
                .andRespond(withSuccess("{\"candidates\":[{\"content\":{\"parts\":[{\"inlineData\":{\"mimeType\":\"audio/wav\",\"data\":\""
                        + java.util.Base64.getEncoder().encodeToString(GeminiSpeechService.wav(new byte[] {0, 1, 2, 3}))
                        + "\"}}]}}]}", MediaType.APPLICATION_JSON));
        byte[] audio = service.generate("visitor:request", "Xin chào");
        assertEquals(48, audio.length);
        ReflectionTestUtils.setField(service, "quotaRetryAt", System.currentTimeMillis() + 60000);
        assertArrayEquals(audio, service.generate("visitor:request", "Xin chào"));
        assertThrows(RuntimeException.class, () -> service.generate("visitor:other", "Hello"));
        server.verify();
    }

    @Test
    void quotaFailureDoesNotCycleThroughKeys() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new GeminiSpeechService("[\"one\",\"two\"]", "gemini-3.8-flash-lite-tts", "Kore", 10);
        ReflectionTestUtils.setField(service, "client", builder.build());
        server.expect(anything()).andRespond(withStatus(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS));
        var error = assertThrows(com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException.class,
                () -> service.generate("visitor:request", "Hello"));
        assertTrue(error.getMessage().contains("quota exhausted"));
        assertThrows(com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException.class,
                () -> service.generate("visitor:another", "Hello"));
        server.verify();
    }
    @Test
    void respectsProviderRetryDelayAndRejectsInvalidValues() {
        assertEquals(3600500, GeminiSpeechService.retryDelayMillis(
                "{\"error\":{\"details\":[{\"@type\":\"type.googleapis.com/google.rpc.RetryInfo\",\"retryDelay\":\"3600.5s\"}]}}"));
        assertEquals(60000, GeminiSpeechService.retryDelayMillis("not json"));
        assertEquals(60000, GeminiSpeechService.retryDelayMillis("{}"));
    }

    @Test
    void streamsBeforeProviderFinishesAndReplaysCompletedAudioWhileSynthesisIsBusy() throws Exception {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new GeminiSpeechService("test-key", "gemini-3.8-flash-lite-tts", "Kore", 2);
        ReflectionTestUtils.setField(service, "client", builder.build());
        var type = MediaType.TEXT_EVENT_STREAM;
        server.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-lite-tts:streamGenerateContent?alt=sse"))
                .andExpect(jsonPath("$.generationConfig.speechConfig.voiceConfig.voice").value("Kore"))
                .andRespond(withSuccess(frame("AAEC") + frame("Aw==") + stopFrame(), type));
        byte[] expected = {0, 1, 2, 3};
        try (var executor = Executors.newVirtualThreadPerTaskExecutor();
                var input = new PipedInputStream(); var output = new PipedOutputStream(input)) {
            server.expect(anything()).andRespond(request -> {
                var response = new org.springframework.mock.http.client.MockClientHttpResponse(input, org.springframework.http.HttpStatus.OK);
                response.getHeaders().setContentType(type);
                return response;
            });
            service.stream("cached", "Xin chào", chunk -> { });
            var first = new CountDownLatch(1);
            var chunks = new ArrayList<byte[]>();
            var pending = executor.submit(() -> service.stream("active", "Hello", chunk -> {
                chunks.add(chunk);
                first.countDown();
            }));
            output.write(frame("AAEC").getBytes(StandardCharsets.UTF_8));
            output.flush();
            assertTrue(first.await(5, TimeUnit.SECONDS));
            assertFalse(pending.isDone());
            assertThrows(com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException.class,
                    () -> service.stream("active", "Hello", chunk -> fail("Duplicate synthesis")));
            assertArrayEquals(GeminiSpeechService.wav(expected), service.generate("cached", "Xin chào"));
            var replay = new java.io.ByteArrayOutputStream();
            service.stream("cached", "Xin chào", replay::writeBytes);
            assertArrayEquals(expected, replay.toByteArray());
            output.write((frame("Aw==") + stopFrame()).getBytes(StandardCharsets.UTF_8));
            output.flush();
            pending.get(5, TimeUnit.SECONDS);
            assertArrayEquals(new byte[] {0, 1, 2}, chunks.getFirst());
            assertArrayEquals(new byte[] {3}, chunks.getLast());
        }
        assertArrayEquals(GeminiSpeechService.wav(expected), service.generate("active", "Hello"));
        server.verify();
    }

    @Test
    void rejectsTruncationInvalidFormatAndOddFinalSample() {
        for (String response : java.util.List.of(
                frame("AAEC"), frame("AAEC") + stopFrame(),
                frame("AAE=").replace("channels=1", "channels=2") + stopFrame(), stopFrame())) {
            var input = new ByteArrayInputStream(response.getBytes(StandardCharsets.UTF_8));
            assertThrows(IOException.class, () -> GeminiSpeechService.readPcm(input, chunk -> { }));
        }
    }

    @Test
    void interruptedReadClosesUpstreamAndReleasesThePermit() throws Exception {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new GeminiSpeechService("test-key", "gemini-3.8-flash-lite-tts", "Kore", 2);
        ReflectionTestUtils.setField(service, "client", builder.build());
        var closed = new CountDownLatch(1);
        try (var executor = Executors.newVirtualThreadPerTaskExecutor();
                var input = new PipedInputStream() {
                    @Override
                    public void close() throws IOException {
                        super.close();
                        closed.countDown();
                    }
                }; var output = new PipedOutputStream(input)) {
            server.expect(anything()).andRespond(request -> {
                var response = new org.springframework.mock.http.client.MockClientHttpResponse(input, org.springframework.http.HttpStatus.OK);
                response.getHeaders().setContentType(MediaType.TEXT_EVENT_STREAM);
                return response;
            });
            server.expect(anything()).andRespond(withSuccess(frame("AAE=") + stopFrame(), MediaType.TEXT_EVENT_STREAM));
            var first = new CountDownLatch(1);
            var released = new CountDownLatch(1);
            var pending = executor.submit(() -> {
                try {
                    service.stream("cancelled", "Hello", chunk -> first.countDown());
                } finally {
                    released.countDown();
                }
            });
            output.write(frame("AAE=").getBytes(StandardCharsets.UTF_8));
            output.flush();
            assertTrue(first.await(5, TimeUnit.SECONDS));
            assertTrue(pending.cancel(true));
            assertTrue(closed.await(5, TimeUnit.SECONDS));
            assertTrue(released.await(5, TimeUnit.SECONDS));
            var bytes = new java.io.ByteArrayOutputStream();
            service.stream("cancelled", "Hello", bytes::writeBytes);
            assertArrayEquals(new byte[] {0, 1}, bytes.toByteArray());
        }
        server.verify();
    }

    @Test
    void providerQuotaStopsBothPathsWithoutRotatingKeys() {
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        var service = new GeminiSpeechService("[\"one\",\"two\"]", "gemini-3.8-flash-lite-tts", "Kore", 10);
        ReflectionTestUtils.setField(service, "client", builder.build());
        server.expect(anything()).andRespond(withStatus(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS));
        assertThrows(com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException.class,
                () -> service.stream("limited", "Hello", chunk -> fail("Unexpected audio")));
        assertThrows(com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.RateLimitExceededException.class,
                () -> service.generate("other", "Hello"));
        server.verify();
    }

    private static String frame(String data) {
        return "data: {\"candidates\":[{\"content\":{\"parts\":[{\"inlineData\":{\"mimeType\":\"audio/l16; rate=24000; channels=1\",\"data\":\""
                + data + "\"}}]}}]}\r\n\r\n";
    }

    private static String stopFrame() {
        return "data: {\"candidates\":[{\"finishReason\":\"STOP\"}]}\n\n";
    }
}
