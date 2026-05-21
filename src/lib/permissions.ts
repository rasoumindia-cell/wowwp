/** Every page in the app that can be restricted. */
export const ALL_PAGES = [
  "dashboard",
  "inbox",
  "contacts",
  "pipelines",
  "broadcasts",
  "automations",
  "settings",
] as const;

export type PageSlug = (typeof ALL_PAGES)[number];

export const PAGE_LABELS: Record<PageSlug, string> = {
  dashboard: "Dashboard",
  inbox: "Inbox",
  contacts: "Contacts",
  pipelines: "Pipelines",
  broadcasts: "Broadcasts",
  automations: "Automations",
  settings: "Settings",
};

export interface ProfileWithPermissions {
  id: string;
  user_id?: string;
  full_name: string | null;
  email: string;
  avatar_url?: string | null;
  role: string | null;
  page_permissions?: string[] | null;
}

export function isAdmin(profile: ProfileWithPermissions | null): boolean {
  return profile?.role === "admin";
}

export function hasPageAccess(
  profile: ProfileWithPermissions | null,
  page: PageSlug,
): boolean {
  if (!profile) return false;
  if (profile.role === "admin") return true;
  return (profile.page_permissions ?? []).includes(page);
}

export function getAccessiblePages(
  profile: ProfileWithPermissions | null,
): PageSlug[] {
  if (!profile) return [];
  if (profile.role === "admin") return [...ALL_PAGES];
  return ALL_PAGES.filter((p) => (profile.page_permissions ?? []).includes(p));
}
