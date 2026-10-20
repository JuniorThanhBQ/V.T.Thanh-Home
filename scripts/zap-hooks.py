#!/usr/bin/env python3

import contextlib
import os


def zap_started(zap, target):
    base = target.rstrip("/")
    is_frontend = ":4200" in base or os.environ.get("ZAP_TARGET_TYPE") == "frontend"
    is_backend = ":8080" in base or os.environ.get("ZAP_TARGET_TYPE") == "backend"

    if is_frontend:
        routes = [
            "",
            "/",
            "/about",
            "/projects",
            "/blog",
            "/contact",
            "/admin",
            "/en",
            "/en/about",
            "/en/projects",
            "/en/blog",
            "/en/contact",
            "/en/admin",
        ]
    elif is_backend:
        routes = [
            "",
            "/",
            "/actuator/health",
            "/actuator/info",
            "/actuator/metrics",
            "/api/v1/projects",
            "/api/v1/blogs",
            "/api/v1/contacts",
            "/api/v1/chat/session",
            "/api/v1/chat/message",
            "/api/v1/admin/login",
            "/api/v1/admin/session",
        ]
    else:
        routes = [""]

    for r in routes:
        full_url = base + r
        with contextlib.suppress(Exception):
            zap.core.access_url(url=full_url, followredirects=True)
