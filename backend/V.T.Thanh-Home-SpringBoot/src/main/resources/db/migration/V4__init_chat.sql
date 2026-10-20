CREATE TABLE chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    ip_address VARCHAR(64),
    user_agent VARCHAR(300),
    created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_session_id BIGINT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE log_chat_history (
    id BIGSERIAL PRIMARY KEY,
    chat_message_id BIGINT NOT NULL UNIQUE REFERENCES chat_messages(id) ON DELETE CASCADE,
    latency INT NOT NULL DEFAULT 0,
    token_used INT NOT NULL DEFAULT 0,
    content_violation BOOLEAN NOT NULL DEFAULT FALSE,
    model VARCHAR(100),
    created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_messages_session ON chat_messages (chat_session_id, created_date ASC);
