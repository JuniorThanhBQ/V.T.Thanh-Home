package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class ChatKnowledgeServiceTest {
    @Test
    void keepsShortContentAndTrimsSurroundingWhitespace() {
        assertThat(ChatKnowledgeService.limitKnowledge("  Portfolio knowledge  ")).isEqualTo("Portfolio knowledge");
    }

    @Test
    void retainsExactlyTwentyThousandAsciiCharacters() {
        String content = "a".repeat(20000);
        assertThat(ChatKnowledgeService.limitKnowledge(content)).isEqualTo(content);
        assertThat(ChatKnowledgeService.limitKnowledge(content + "discarded")).isEqualTo(content);
    }

    @Test
    void countsVietnameseCharactersInsteadOfUtf8Bytes() {
        String content = "ệ".repeat(20000);
        assertThat(ChatKnowledgeService.limitKnowledge(content + "discarded")).isEqualTo(content);
    }

    @Test
    void preservesSupplementaryUnicodeCodePoints() {
        String emoji = new String(Character.toChars(0x1F98A));
        String expected = "a".repeat(19999) + emoji;
        String actual = ChatKnowledgeService.limitKnowledge(expected + "discarded");
        assertThat(actual).isEqualTo(expected);
        assertThat(actual.codePointCount(0, actual.length())).isEqualTo(20000);
        assertThat(actual).doesNotContain("\uFFFD");
    }

    @Test
    void fitsTwentyThousandFourByteCodePointsWithinDownloadLimit() {
        String content = new String(Character.toChars(0x1F98A)).repeat(20000);
        assertThat(content.getBytes(java.nio.charset.StandardCharsets.UTF_8)).hasSize(80000);
        assertThat(ChatKnowledgeService.limitKnowledge(content + "discarded")).isEqualTo(content);
    }
}
