export const isSupabaseMocked = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    !url ||
    url.includes("your-project") ||
    !key ||
    key.includes("your-anon-key") ||
    key.includes("PASTE_YOUR_REAL") ||
    key.length < 20  // placeholder keys are short
  );
};

