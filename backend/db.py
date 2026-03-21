"""Supabase client management.

Two clients available:
- `supabase` (service key): For admin operations (health checks, migrations). Bypasses RLS.
- `get_user_client(token)`: Per-request client using user's JWT. RLS enforced.
"""
from supabase import create_client
import os

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

# Service-key client — bypasses RLS. Use ONLY for admin operations.
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_user_client(token: str):
    """Create a Supabase client authenticated with the user's JWT.

    RLS policies are enforced — queries only return data the user owns.
    """
    anon_key = SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY
    client = create_client(SUPABASE_URL, anon_key)
    client.postgrest.auth(token)
    return client
