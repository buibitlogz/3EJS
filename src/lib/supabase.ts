const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  message: string;
  details?: string;
  code?: string;
}

export interface CountResponse {
  count: number;
}

export async function supabaseFetch<T>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    id?: string;
  } = {}
): Promise<SupabaseResponse<T[]>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured - check .env.local' } };
  }

  const { method = 'GET', body, params, id } = options;
  let url = `${SUPABASE_URL}/rest/v1/${table}`;

  if (id) {
    url += `?id=eq.${encodeURIComponent(id)}`;
  }

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.append(key, value);
    }
    if (!id) {
      url += `?${searchParams.toString()}`;
    }
  }

  const headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log('[Supabase] Response:', res.status, res.statusText, 'for', method, url);

    if (!res.ok) {
      let errorData: Record<string, unknown> = {};
      try {
        const text = await res.text();
        console.log('[Supabase] Error body:', text);
        errorData = JSON.parse(text);
      } catch {
        console.log('[Supabase] Could not parse error body');
      }
      console.log('[Supabase] Error response:', JSON.stringify(errorData));
      return {
        data: null,
        error: {
          message: String(errorData.message || `HTTP ${res.status}`),
          code: String(errorData.code || ''),
        },
      };
    }

    const data = await res.json();
    if (data === null || data === undefined) return { data: [], error: null };
    return { data: Array.isArray(data) ? data : [data], error: null };
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : String(err) } };
  }
}

export const supabase = {
  from: <T>(table: string) => ({
    select: (columns = '*') => ({
      eq: (column: string, value: unknown) => ({
        single: async () => supabaseFetch<T>(table, { params: { [column]: `eq.${value}`, select: columns } }).then(r => ({ ...r, data: r.data?.[0] ?? null })),
        execute: async () => supabaseFetch<T>(table, { params: { [column]: `eq.${value}`, select: columns } }),
      }),
      execute: async () => supabaseFetch<T>(table, { params: { select: columns } }),
      single: async () => supabaseFetch<T>(table).then(r => ({ ...r, data: r.data?.[0] ?? null })),
    }),
    insert: async (row: Record<string, unknown>) => {
      const { data, error } = await supabaseFetch<T>(table, { method: 'POST', body: row });
      return { data: data?.[0] ?? null, error };
    },
    update: (id: string, updates: Record<string, unknown>) => ({
      execute: async () => supabaseFetch<T>(table, { method: 'PATCH', body: updates, id }),
    }),
    delete: (id: string) => ({
      execute: async () => supabaseFetch<T>(table, { method: 'DELETE', id }),
    }),
    upsert: async (rows: Record<string, unknown>[]) => {
      const { data, error } = await supabaseFetch<T>(table, {
        method: 'POST',
        body: rows as unknown as Record<string, unknown>,
      });
      return { data, error };
    },
  }),
};

export function isSupabaseConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };