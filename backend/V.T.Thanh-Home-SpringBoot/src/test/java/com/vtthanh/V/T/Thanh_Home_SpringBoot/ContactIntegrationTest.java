package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.jayway.jsonpath.JsonPath;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.AdminAccount;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.entity.Contact;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.AdminAccountRepository;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.ContactRepository;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.service.ContactRateLimiterService;
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
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@org.springframework.test.context.ContextConfiguration(initializers = SafeTestDatabaseInitializer.class)
@SpringBootTest
class ContactIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private AdminAccountRepository adminAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ContactRateLimiterService rateLimiterService;

    @Autowired
    private com.vtthanh.V.T.Thanh_Home_SpringBoot.service.VisitorService visitors;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        var registration = new org.springframework.mock.web.MockHttpServletRequest();
        registration.setSession(new MockHttpSession());
        visitors.register(registration, new com.vtthanh.V.T.Thanh_Home_SpringBoot.dto.VisitorRequest("en", "UTC"));
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .defaultRequest(get("/").session((MockHttpSession) registration.getSession()))
                .apply(springSecurity())
                .build();

        contactRepository.deleteAll();
        rateLimiterService.resetForIp("127.0.0.1");

        if (!adminAccountRepository.existsByUsername("stage4admin")) {
            adminAccountRepository.save(new AdminAccount("stage4admin", passwordEncoder.encode("SecretPass123!")));
        }
    }

    private MockHttpSession loginAsAdmin() throws Exception {
        String loginBody = "{\"username\":\"stage4admin\",\"password\":\"SecretPass123!\"}";
        MvcResult loginResult = mockMvc.perform(post("/api/v1/admin/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) loginResult.getRequest().getSession();
    }

    @Test
    void publicContactSubmissionSuccess() throws Exception {
        String requestJson = "{\"firstName\":\"Alice\",\"lastName\":\"Smith\",\"email\":\"alice@example.com\",\"phone\":\"0123456789\",\"service\":\"Web Development\",\"message\":\"I would like to discuss a project with you.\"}";

        MvcResult result = mockMvc.perform(post("/api/v1/contacts").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("RECEIVED"))
                .andExpect(jsonPath("$.id").isNumber())
                .andReturn();

        Long id = ((Number) JsonPath.read(result.getResponse().getContentAsString(), "$.id")).longValue();
        Contact saved = contactRepository.findById(id).orElse(null);
        assertThat(saved).isNotNull();
        assertThat(saved.getFirstName()).isEqualTo("Alice");
        assertThat(saved.getSubject()).isEqualTo("Web Development");
    }

    @Test
    void publicContactSubmissionValidationFails() throws Exception {
        String invalidJson = "{\"firstName\":\"A\",\"email\":\"not-an-email\",\"message\":\"short\"}";

        mockMvc.perform(post("/api/v1/contacts").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"));
    }

    @Test
    void idempotentContactSubmissionReturnsSameReceipt() throws Exception {
        String requestJson = "{\"firstName\":\"Bob\",\"email\":\"bob@example.com\",\"service\":\"Mobile App\",\"message\":\"Need a consultation for a mobile application.\",\"idempotencyKey\":\"idem-unique-123\"}";

        MvcResult result1 = mockMvc.perform(post("/api/v1/contacts").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isAccepted())
                .andReturn();

        MvcResult result2 = mockMvc.perform(post("/api/v1/contacts").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isAccepted())
                .andReturn();

        Long id1 = ((Number) JsonPath.read(result1.getResponse().getContentAsString(), "$.id")).longValue();
        Long id2 = ((Number) JsonPath.read(result2.getResponse().getContentAsString(), "$.id")).longValue();

        assertThat(id1).isEqualTo(id2);
        assertThat(contactRepository.count()).isEqualTo(1L);
    }

    @Test
    void rateLimitingBlocksExcessiveSubmissions() throws Exception {
        for (int i = 0; i < 5; i++) {
            String requestJson = "{\"firstName\":\"User" + i + "\",\"email\":\"user" + i + "@example.com\",\"service\":\"General\",\"message\":\"Hello there testing rate limiter message.\"}";
            mockMvc.perform(post("/api/v1/contacts").with(csrf())
                            .with(request -> {
                                request.setRemoteAddr("10.0.0.99");
                                return request;
                            })
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(requestJson))
                    .andExpect(status().isAccepted());
        }

        String blockedJson = "{\"firstName\":\"Blocked\",\"email\":\"blocked@example.com\",\"service\":\"General\",\"message\":\"This request should be rate limited.\"}";
        mockMvc.perform(post("/api/v1/contacts").with(csrf())
                        .with(request -> {
                            request.setRemoteAddr("10.0.0.99");
                            return request;
                        })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(blockedJson))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    @Test
    void adminContactLifecycle() throws Exception {
        mockMvc.perform(get("/api/v1/admin/contacts"))
                .andExpect(status().isUnauthorized());

        Contact contact = new Contact("Charlie", "charlie@example.com", "Consulting", "Need some advice on system architecture.");
        contactRepository.save(contact);

        MockHttpSession session = loginAsAdmin();

        mockMvc.perform(get("/api/v1/admin/contacts").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.email == 'charlie@example.com')]").exists());

        mockMvc.perform(get("/api/v1/admin/contacts/" + contact.getId()).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Charlie"));

        mockMvc.perform(delete("/api/v1/admin/contacts/" + contact.getId())
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/admin/contacts/" + contact.getId()).session(session))
                .andExpect(status().isNotFound());
    }
}
