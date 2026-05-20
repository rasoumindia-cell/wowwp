import type { CapacitorConfig } from "@capacitor/cli";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * WACRM Android shell — opens your server's /login on launch.
 *
 * Set CAPACITOR_SERVER_URL at build time, or rely on NEXT_PUBLIC_SITE_URL
 * from .env.local (e.g. http://192.168.1.8:3000 → http://192.168.1.8:3000/login).
 */
function loadSiteUrlFromEnvLocal(): void {
  const envPath = join(__dirname, ".env.local");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key === "NEXT_PUBLIC_SITE_URL" && !process.env.NEXT_PUBLIC_SITE_URL) {
      process.env.NEXT_PUBLIC_SITE_URL = value;
    }
  }
}

function resolveServerUrl(): string | undefined {
  loadSiteUrlFromEnvLocal();

  const raw =
    process.env.CAPACITOR_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return undefined;

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  const url = new URL(withScheme);

  // Default to the WACRM login page unless a path is already specified.
  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/login";
  }

  return url.toString().replace(/\/$/, "");
}

const serverUrl = resolveServerUrl();

const config: CapacitorConfig = {
  appId: "tech.wacrm.mobile",
  appName: "Wow WP",
  webDir: "mobile-shell",
  android: {
    allowMixedContent: true,
  },
  server: serverUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith("http://"),
        androidScheme: serverUrl.startsWith("https://") ? "https" : "http",
      }
    : undefined,
};

export default config;
