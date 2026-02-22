CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id                UUID         NOT NULL DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    display_name      VARCHAR(255) NOT NULL,
    profile_image_url VARCHAR(500),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS diary_entries (
    id                       UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id                  UUID         NOT NULL,
    content                  TEXT,
    date                     DATE         NOT NULL,
    weather                  VARCHAR(20),
    is_public                BOOLEAN      NOT NULL DEFAULT FALSE,
    image_url                VARCHAR(500),
    image_name               VARCHAR(255),
    audio_url                VARCHAR(500),
    audio_name               VARCHAR(255),
    events                   TEXT,
    emotions                 TEXT,
    good_things              TEXT,
    reflections              TEXT,
    gratitude                TEXT,
    tomorrow_goals           TEXT,
    tomorrow_looking_forward TEXT,
    learnings                TEXT,
    health_habits            TEXT,
    today_in_one_word        VARCHAR(100),
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT diary_entries_pkey PRIMARY KEY (id),
    CONSTRAINT diary_entries_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id
    ON diary_entries (user_id);

CREATE INDEX IF NOT EXISTS idx_diary_entries_public
    ON diary_entries (is_public, created_at DESC)
    WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_diary_entries_date
    ON diary_entries (user_id, date DESC, created_at DESC);
