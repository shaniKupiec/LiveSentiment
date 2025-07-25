-- This file is optional; EF Core migrations are preferred for schema management.
-- Provided for local dev convenience.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "Presenter" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    login_method VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS "Presentation" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presenter_id UUID REFERENCES "Presenter"(id),
    title VARCHAR(255),
    date TIMESTAMP,
    label VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS "Poll" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    presentation_id UUID REFERENCES "Presentation"(id),
    question TEXT,
    type VARCHAR(50),
    options JSONB,
    active BOOLEAN
);

CREATE TABLE IF NOT EXISTS "Response" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES "Poll"(id),
    value TEXT,
    timestamp TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SentimentAggregate" (
    poll_id UUID PRIMARY KEY REFERENCES "Poll"(id),
    aggregated_since TIMESTAMP,
    sentiment_counts JSONB,
    emotion_counts JSONB,
    keywords JSONB
); 