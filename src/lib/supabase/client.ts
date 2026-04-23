import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./config";

export function createClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase no está configurado.");
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
