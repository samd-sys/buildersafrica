import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://gcfnxdisvyvsdnajmloq.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZm54ZGlzdnl2c2RuYWptbG9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDg0MjUsImV4cCI6MjA4ODU4NDQyNX0.CdKj6ZrkiI0E-WbW3KeilqhtPfeAF76VeppBoOn-yK4"

export const supabase = createClient(supabaseUrl, supabaseKey)