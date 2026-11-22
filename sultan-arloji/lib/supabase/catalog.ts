import { getSupabaseAdmin } from "./admin";

const PAGE_SIZE = 500;

export async function readAllRows<T>(
  readPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await readPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export function readProducts() {
  const supabase = getSupabaseAdmin();
  return readAllRows((from, to) => supabase.from("products").select("*")
    .order("whatsapp_clicks", { ascending: false }).order("id").range(from, to));
}
