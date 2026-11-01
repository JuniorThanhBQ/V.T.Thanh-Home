package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.junit.jupiter.api.Test;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import static org.assertj.core.api.Assertions.*;

class GroqStreamingTest {
    @Test
    void forwardsOnlyContentAndRequiresProviderCompletion() throws Exception {
        String body = "data: {\"choices\":[{\"delta\":{\"reasoning\":\"private\",\"content\":\"Xin ch\u00e0o \u65e5\u672c\"}}]}\r\n\r\n"
                + "data: {\"choices\":[],\"x_groq\":{\"usage\":{\"total_tokens\":42}}}\n\n"
                + "data: [DONE]\n\n";
        var chunks = new ArrayList<String>();
        var result = GroqChatClient.readStream(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)), chunks::add, "test", System.nanoTime());
        assertThat(chunks).containsExactly("Xin ch\u00e0o \u65e5\u672c");
        assertThat(result.tokensUsed()).isEqualTo(42);
        assertThatThrownBy(() -> GroqChatClient.readStream(new ByteArrayInputStream("data: {}\n\n".getBytes(StandardCharsets.UTF_8)), chunks::add, "test", System.nanoTime()))
                .isInstanceOf(java.io.IOException.class);
    }

    @Test
    void rejectsProviderErrorAndOversizedAnswers() {
        for (String payload : new String[] {"{\"error\":{}}", "{\"choices\":[{\"delta\":{\"content\":\"" + "x".repeat(20001) + "\"}}]}"}) {
            assertThatThrownBy(() -> GroqChatClient.readStream(new ByteArrayInputStream(("data: " + payload + "\n\n").getBytes(StandardCharsets.UTF_8)), text -> { }, "test", System.nanoTime()))
                    .isInstanceOf(java.io.IOException.class);
        }
    }
}
