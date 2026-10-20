package com.vtthanh.V.T.Thanh_Home_SpringBoot.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

@Component
@Order(-90)
public class RequestSizeFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/") || "GET".equals(request.getMethod())
                || "OPTIONS".equals(request.getMethod()) || "HEAD".equals(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        int limit = request.getRequestURI().startsWith("/api/v1/admin/blogs") ? 256 * 1024 : 16 * 1024;
        if (request.getContentLengthLong() > limit) {
            response.sendError(413, "Request body too large");
            return;
        }
        byte[] body = request.getInputStream().readNBytes(limit + 1);
        if (body.length > limit) {
            response.sendError(413, "Request body too large");
            return;
        }
        chain.doFilter(new HttpServletRequestWrapper(request) {
            @Override
            public ServletInputStream getInputStream() {
                var input = new ByteArrayInputStream(body);
                return new ServletInputStream() {
                    @Override
                    public int read() {
                        return input.read();
                    }
                    @Override
                    public boolean isFinished() {
                        return input.available() == 0;
                    }
                    @Override
                    public boolean isReady() {
                        return true;
                    }
                    @Override
                    public void setReadListener(ReadListener listener) {
                        throw new UnsupportedOperationException();
                    }
                };
            }

            @Override
            public BufferedReader getReader() {
                return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
            }
        }, response);
    }
}
