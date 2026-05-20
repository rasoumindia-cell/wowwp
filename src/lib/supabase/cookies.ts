import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Cookie options shared by browser + middleware + server clients.
 * On http:// LAN dev, Secure cookies are not stored by the browser.
 */
export function supabaseCookieOptions(): CookieOptionsWithName {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const secure = siteUrl.startsWith("https://");

  return {
    secure,
    sameSite: "lax",
    path: "/",
  };
}
