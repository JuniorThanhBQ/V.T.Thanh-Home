CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(50),
    phone VARCHAR(30),
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    delivery_attempts INT NOT NULL DEFAULT 0,
    last_delivery_attempt TIMESTAMPTZ,
    last_delivery_error TEXT,
    idempotency_key VARCHAR(128),
    ip_address VARCHAR(64),
    user_agent VARCHAR(300),
    created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_status_created ON contacts (status, created_date);
CREATE INDEX idx_contacts_idempotency ON contacts (idempotency_key) WHERE idempotency_key IS NOT NULL;
