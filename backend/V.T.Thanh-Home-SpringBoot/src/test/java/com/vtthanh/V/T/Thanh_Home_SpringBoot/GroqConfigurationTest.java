package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.exception.ServiceUnavailableException;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.GroqChatClient;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.GroqKeyProvider;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class GroqConfigurationTest {
    @Test
    void missingCredentialsNeverProduceSimulatedSuccessfulAnswers() {
        var client = new GroqChatClient(new GroqKeyProvider("", ""), "test-model");
        assertThatThrownBy(() -> client.generateResponse("public context", List.of(), "hello"))
                .isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void supportsSingleAndArrayKeysWithoutDuplicateEntries() {
        var provider = new GroqKeyProvider("[\"key-one\",\"key-two\"]", "key-one");
        assertThat(provider.getKeyCount()).isEqualTo(2);
    }
}
