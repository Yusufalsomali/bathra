-- Allow 'saved' as a connection type for investor watchlist feature.
-- Must drop and recreate the check constraint (PostgreSQL cannot ALTER CHECK inline).

ALTER TABLE public.investor_startup_connections
  DROP CONSTRAINT IF EXISTS investor_startup_connections_connection_type_check;

ALTER TABLE public.investor_startup_connections
  ADD CONSTRAINT investor_startup_connections_connection_type_check
  CHECK (connection_type IN ('interested', 'info_request', 'saved'));
