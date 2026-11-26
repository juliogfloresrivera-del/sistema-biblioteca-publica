const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseKey || "placeholder-key"
);

module.exports = supabase;