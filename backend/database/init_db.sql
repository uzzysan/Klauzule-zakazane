-- FairPact Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'FairPact database initialized successfully!';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pgvector, pg_trgm';
END $$;
