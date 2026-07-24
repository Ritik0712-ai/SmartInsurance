import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }
  return supabase;
}

export async function query<T>(table: string, params?: any): Promise<T[]> {
  const supabase = getSupabase();
  let query = supabase.from(table).select('*');

  if (params?.eq) {
    for (const [key, value] of Object.entries(params.eq)) {
      query = query.eq(key, value);
    }
  }

  if (params?.in) {
    for (const [key, value] of Object.entries(params.in)) {
      query = query.in(key, value as any);
    }
  }

  if (params?.order) {
    query = query.order(params.order.column, { ascending: params.order.ascending });
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function queryOne<T>(table: string, params: any): Promise<T | null> {
  const results = await query<T>(table, { ...params, limit: 1 });
  return results[0] || null;
}

export async function insert(table: string, data: any) {
  const supabase = getSupabase();
  const { data: result, error } = await supabase.from(table).insert(data).select().single();
  if (error) throw new Error(error.message);
  return result;
}

export async function update(table: string, id: string, data: any) {
  const supabase = getSupabase();
  const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return result;
}

export async function remove(table: string, id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function count(table: string, params?: any): Promise<number> {
  const supabase = getSupabase();
  let query = supabase.from(table).select('*', { count: 'exact', head: true });

  if (params?.eq) {
    for (const [key, value] of Object.entries(params.eq)) {
      query = query.eq(key, value);
    }
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}
