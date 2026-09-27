CREATE INDEX rate_limits_expiry ON rate_limits(expires_at);
CREATE INDEX diagnostic_events_time ON events(created_at);
