package com.vtthanh.V.T.Thanh_Home_SpringBoot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final CorsProperties corsProperties;

	public WebConfig(CorsProperties corsProperties) {
		this.corsProperties = corsProperties;
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
				.allowedOriginPatterns(corsProperties.allowedOrigins().toArray(new String[0]))
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
				.allowedHeaders("Content-Type", "X-XSRF-TOKEN")
				.exposedHeaders("X-Total-Count", "X-Request-Id", "Content-Disposition", "Retry-After")
				.allowCredentials(true)
				.maxAge(3600);
	}

	@Override
	public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
		configurer.setDefaultTimeout(60000);
	}
}
