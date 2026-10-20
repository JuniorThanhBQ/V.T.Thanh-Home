package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.AdminAccount;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.AdminAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AdminAuthIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private AdminAccountRepository adminAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        if (!adminAccountRepository.existsByUsername("testadmin")) {
            adminAccountRepository.save(new AdminAccount("testadmin", passwordEncoder.encode("SecretPass123!")));
        }
    }

    @Test
    void unauthenticatedAdminAccessReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/session"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidLoginReturnsUnauthorized() throws Exception {
        String body = "{\"username\":\"testadmin\",\"password\":\"WrongPassword\"}";
        mockMvc.perform(post("/api/v1/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_FAILED"));
    }

    @Test
    void validLoginSucceedsAndAllowsSubsequentProtectedCalls() throws Exception {
        String loginBody = "{\"username\":\"testadmin\",\"password\":\"SecretPass123!\"}";
        MvcResult loginResult = mockMvc.perform(post("/api/v1/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("testadmin"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();

        mockMvc.perform(get("/api/v1/admin/session").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.username").value("testadmin"));

        mockMvc.perform(post("/api/v1/admin/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/session").session(session))
                .andExpect(status().isUnauthorized());
    }
}
