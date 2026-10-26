package com.vtthanh.V.T.Thanh_Home_SpringBoot;

import com.vtthanh.V.T.Thanh_Home_SpringBoot.config.CorsProperties;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.config.SecurityConfig;
import com.vtthanh.V.T.Thanh_Home_SpringBoot.config.WebConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.util.List;
import java.util.Map;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringJUnitWebConfig(classes = {SecurityConfig.class, WebConfig.class, CorsSecurityTest.MvcConfiguration.class})
class CorsSecurityTest {

    private static final String FRONTEND_ORIGIN = "https://www.juniorthanh.id.vn";

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://localhost:4200", "http://127.0.0.1:4200",
            "https://www.juniorthanh.id.vn", "https://vtthanh-home-angular.vercel.app"})
    void configuredOriginsAllowJsonAndCsrfHeaders(String origin) throws Exception {
        mockMvc.perform(options("/api/v1/visitors")
                        .header(HttpHeaders.ORIGIN, origin)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type,x-xsrf-token"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, containsString("content-type")))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, containsString("x-xsrf-token")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"Authorization", "X-Admin-Override", "X-Forwarded-For"})
    void unexpectedHeadersAreRejected(String requestedHeader) throws Exception {
        mockMvc.perform(options("/api/v1/visitors")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, requestedHeader))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @Test
    void sentryTraceHeadersAreAllowedBySecurityAndMvc() throws Exception {
        for (MockMvc mvc : List.of(mockMvc, MockMvcBuilders.webAppContextSetup(context).build())) {
            mvc.perform(options("/api/v1/visitors")
                            .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type,sentry-trace,baggage"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, containsString("sentry-trace")))
                    .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, containsString("baggage")));
        }
    }

    @Test
    void mvcCorsConfigurationRejectsUnexpectedHeadersWithoutSecurityFilter() throws Exception {
        MockMvc mvcOnly = MockMvcBuilders.webAppContextSetup(context).build();
        mvcOnly.perform(options("/api/v1/visitors")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));

        mvcOnly.perform(options("/api/v1/visitors")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type,X-XSRF-TOKEN"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN));
    }

    @Test
    void mixedHeaderRequestDoesNotAuthorizeUnexpectedHeader() throws Exception {
        mockMvc.perform(options("/api/v1/visitors")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type,X-Admin-Override"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, containsString("Content-Type")))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS, not(containsString("X-Admin-Override"))));
    }

    @Test
    void untrustedOriginIsRejected() throws Exception {
        mockMvc.perform(options("/api/v1/visitors")
                        .header(HttpHeaders.ORIGIN, "https://untrusted.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }

    @ParameterizedTest
    @ValueSource(strings = {"POST", "PUT", "PATCH", "DELETE"})
    void protectedApiPreflightsDoNotRequireLogin(String method) throws Exception {
        mockMvc.perform(options("/api/v1/admin/projects")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, method)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type,X-XSRF-TOKEN"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN));
    }

    @Test
    void healthPreflightRemainsAccessible() throws Exception {
        mockMvc.perform(options("/actuator/health")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN));
    }

    @Test
    void allowedCorsOriginDoesNotBypassCsrf() throws Exception {
        mockMvc.perform(post("/api/v1/visitors")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/visitors").with(csrf().asHeader())
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    void allowedCorsOriginDoesNotGrantAdminAccess() throws Exception {
        mockMvc.perform(get("/api/v1/admin/projects").header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN))
                .andExpect(status().isUnauthorized());
    }

    @Configuration
    @EnableWebMvc
    static class MvcConfiguration {
        @Bean
        CorsProperties corsProperties() {
            return new CorsProperties(List.of("http://localhost:4200", "http://127.0.0.1:4200",
                    "https://www.juniorthanh.id.vn", "https://vtthanh-home-angular.vercel.app"));
        }

        @Bean
        ProbeController probeController() {
            return new ProbeController();
        }
    }

    @RestController
    static class ProbeController {
        @PostMapping("/api/v1/visitors")
        Map<String, Boolean> register() {
            return Map.of("registered", true);
        }

        @GetMapping("/api/v1/admin/projects")
        List<String> projects() {
            return List.of();
        }
    }
}
