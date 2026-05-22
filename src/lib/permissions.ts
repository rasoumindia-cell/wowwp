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

export function isStaff(profile: ProfileWithPermissions | null): boolean {
  return profile?.role === "staff";
}

/** Admin & regular users see all pages. Only staff are restricted to their
 *  page_permissions array. */
function permsOrAll(
  profile: ProfileWithPermissions | null,
): PageSlug[] {
  if (!profile) return [];
  if (profile.role !== "staff") return [...ALL_PAGES];
  const p = profile.page_permissions;
  if (!Array.isArray(p) || p.length === 0) return [...ALL_PAGES];
  return ALL_PAGES.filter((slug) => p.includes(slug));
}

export function hasPageAccess(
  profile: ProfileWithPermissions | null,
  page: PageSlug,
): boolean {
  return permsOrAll(profile).includes(page);
}

export function getAccessiblePages(
  profile: ProfileWithPermissions | null,
): PageSlug[] {
  return permsOrAll(profile);
}
