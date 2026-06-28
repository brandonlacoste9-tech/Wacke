export const isSupabaseMocked = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    !url ||
    url.includes("your-project") ||
    !key ||
    key.includes("your-anon-key")
  );
};

export const isMuxMocked = (): boolean => {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  return (
    !tokenId ||
    tokenId.includes("your-mux-token-id") ||
    !tokenSecret ||
    tokenSecret.includes("your-mux-token-secret")
  );
};
