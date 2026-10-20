package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.repository.VisitorRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@org.springframework.test.context.ContextConfiguration(initializers = SafeTestDatabaseInitializer.class)
@SpringBootTest
@org.springframework.test.annotation.DirtiesContext(classMode = org.springframework.test.annotation.DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class VisitorIntegrationTest {
    @Autowired private WebApplicationContext context;
    @Autowired private VisitorRepository visitors;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(com.vtthanh.V.T.Thanh_Home_SpringBoot.config.RequestSizeFilter.class))
                .apply(springSecurity()).build();
    }

    @Test
    void browserCanBootstrapCookieCsrfAndRegisterWithoutExposingIdentityToken() throws Exception {
        var bootstrap = mvc.perform(get("/api/v1/security/csrf")).andExpect(status().isOk()).andReturn();
        Cookie cookie = bootstrap.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        MockHttpSession session = new MockHttpSession();
        long initial = visitors.count();
        mvc.perform(post("/api/v1/visitors").session(session).cookie(cookie).header("X-XSRF-TOKEN", cookie.getValue())
                .header("X-Forwarded-For", "spoofed-client-ip").header("User-Agent", "test-browser")
                .contentType(MediaType.APPLICATION_JSON).content("{\"language\":\"en\",\"timeZone\":\"Asia/Saigon\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.registered").value(true))
                .andExpect(jsonPath("$.visitorToken").doesNotExist());
        mvc.perform(post("/api/v1/visitors").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"language\":\"vi\",\"timeZone\":\"Asia/Saigon\"}"))
                .andExpect(status().isOk());
        assertThat(visitors.count()).isEqualTo(initial + 1);
        var saved = visitors.findById((Long) session.getAttribute("VISITOR_ID")).orElseThrow();
        assertThat(saved.getIpAddress()).isEqualTo("127.0.0.1");
    }

    @Test
    void oversizedAndMalformedRequestsAreRejected() throws Exception {
        mvc.perform(post("/api/v1/visitors").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("x".repeat(17000))).andExpect(status().isPayloadTooLarge());
        mvc.perform(post("/api/v1/visitors").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("invalid-json")).andExpect(status().isBadRequest());
    }

    @Test
    void administratorCanBlockAVisitorWithoutExposingVisitorCredentials() throws Exception {
        var session = new MockHttpSession();
        mvc.perform(post("/api/v1/visitors").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"language\":\"en\",\"timeZone\":\"UTC\"}")).andExpect(status().isOk());
        Long id = (Long) session.getAttribute("VISITOR_ID");
        mvc.perform(get("/api/v1/admin/users")).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/v1/admin/users/" + id + "/block")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                .with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"blocked\":true,\"reason\":\"test\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.blocked").value(true))
                .andExpect(jsonPath("$.visitorToken").doesNotExist());
        mvc.perform(post("/api/v1/chat/session").session(session).with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void writesRequireCsrfAndPublicConfigurationContainsNoSecrets() throws Exception {
        mvc.perform(post("/api/v1/visitors").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/security/config")).andExpect(status().isOk())
                .andExpect(jsonPath("$.turnstileSiteKey").isString())
                .andExpect(jsonPath("$.secretKey").doesNotExist());
    }
}
