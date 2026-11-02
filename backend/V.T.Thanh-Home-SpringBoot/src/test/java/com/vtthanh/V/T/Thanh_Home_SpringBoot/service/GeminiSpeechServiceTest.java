package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
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
}
