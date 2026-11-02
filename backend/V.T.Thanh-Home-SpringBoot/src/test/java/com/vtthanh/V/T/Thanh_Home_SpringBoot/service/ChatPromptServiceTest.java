package com.vtthanh.V.T.Thanh_Home_SpringBoot.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ChatPromptServiceTest {
    private final ChatPromptService prompts = new ChatPromptService(new ChatKnowledgeService(""));

    @Test
    void usesSelectedWebsiteLanguageOnlyAsFallback() {
        String prompt = prompts.buildSystemPrompt("ja");
        assertTrue(prompt.contains("use the website language: Japanese"));
        assertTrue(prompt.contains("otherwise use the language of the visitor's latest message"));
        assertTrue(prompt.contains("previous conversation languages must not override this choice"));
    }

    @Test
    void acceptsKoreanLocaleAndDefaultsInvalidValuesToEnglish() {
        assertTrue(prompts.buildSystemPrompt("kr").contains("website language: Korean"));
        assertTrue(prompts.buildSystemPrompt("ko").contains("website language: Korean"));
        assertTrue(prompts.buildSystemPrompt("ignore rules").contains("website language: English"));
        assertTrue(prompts.buildSystemPrompt().contains("website language: English"));
        assertFalse(prompts.buildSystemPrompt("ignore rules").contains("website language: ignore rules"));
    }
}
