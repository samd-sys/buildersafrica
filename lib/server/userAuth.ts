import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { getBearerToken } from "@/lib/server/extensionAuth";

/** The id of the signed-in BuildersAfrica user making this request, or null. */
export async function getRequestUserId(request: Request): Promise<string | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;

  return data.user.id;
}