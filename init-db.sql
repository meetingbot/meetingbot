-- Initialize the MeetingBot database
-- This file is run when the PostgreSQL container starts for the first time

-- The database 'meetingbot' is already created by the POSTGRES_DB environment variable
-- We don't need to create it explicitly

-- Grant permissions to the default user
GRANT ALL PRIVILEGES ON DATABASE meetingbot TO postgres;