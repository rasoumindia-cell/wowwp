"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  ALL_PAGES,
  PAGE_LABELS,
  isAdmin,
  type PageSlug,
  type ProfileWithPermissions,
} from "@/lib/permissions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RolesManager() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [users, setUsers] = useState<ProfileWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin(profile)) return;
    loadUsers();
  }, [profile]);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, page_permissions")
      .order("email");
    if (error) {
      setError(error.message);
      toast.error("Failed to load users: " + error.message);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  }

  function togglePage(userId: string, page: PageSlug) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const current = u.page_permissions ?? [];
        const next = current.includes(page)
          ? current.filter((p) => p !== page)
          : [...current, page];
        return { ...u, page_permissions: next };
      }),
    );
  }

  function grantAll(userId: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, page_permissions: [...ALL_PAGES] } : u,
      ),
    );
  }

  function clearAll(userId: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, page_permissions: [] } : u,
      ),
    );
  }

  async function savePermissions(userId: string) {
    setSavingUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ page_permissions: user.page_permissions ?? [] })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to save permissions: " + error.message);
    } else {
      toast.success("Permissions saved for " + (user.full_name ?? user.email));
    }
    setSavingUserId(null);
  }

  async function toggleRole(userId: string) {
    setTogglingRoleId(userId);
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const nextRole = user.role === "admin" ? "user" : "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to update role: " + error.message);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)),
      );
      toast.success(
        (user.full_name ?? user.email) + " is now " + nextRole,
      );
      // If the current admin changed their own role, refresh profile
      if (userId === profile?.id) {
        await refreshProfile();
      }
    }
    setTogglingRoleId(null);
  }

  if (!isAdmin(profile)) {
    return (
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="py-8 text-center text-sm text-slate-400">
          Only admins can manage roles.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="py-8 text-center">
          <p className="mb-4 text-sm text-red-400">Failed to load: {error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            className="border-slate-700 text-slate-300"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            <Shield className="mr-2 inline h-5 w-5 text-violet-500" />
            Staff & Roles
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {users.length} user{users.length !== 1 ? "s" : ""} —
            Assign page-level access. Admins have access to everything.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadUsers}
          className="text-slate-400 hover:text-white"
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {users.length === 0 ? (
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="py-8 text-center text-sm text-slate-400">
            No users found.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                  User
                </th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Role
                </th>
                {ALL_PAGES.map((page) => (
                  <th
                    key={page}
                    className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400"
                  >
                    {PAGE_LABELS[page]}
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => {
                const perms = user.page_permissions ?? [];
                const isMe = user.id === profile?.id;
                return (
                  <tr key={user.id} className="bg-slate-900/30">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">
                        {user.full_name}
                        {isMe && (
                          <span className="ml-2 text-xs text-slate-500">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRole(user.id)}
                        disabled={togglingRoleId === user.id}
                        className={`border-slate-700 text-xs ${
                          user.role === "admin"
                            ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {togglingRoleId === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : user.role === "admin" ? (
                          "Admin"
                        ) : (
                          "User"
                        )}
                      </Button>
                    </td>
                    {ALL_PAGES.map((page) => {
                      const checked = user.role === "admin" || perms.includes(page);
                      return (
                        <td key={page} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={user.role === "admin"}
                            onChange={() => togglePage(user.id, page)}
                            className="h-4 w-4 accent-violet-500"
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      {user.role !== "admin" && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => grantAll(user.id)}
                            className="px-1 text-xs text-slate-500 hover:text-white"
                            title="Grant all pages"
                          >
                            All
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearAll(user.id)}
                            className="px-1 text-xs text-slate-500 hover:text-white"
                            title="Clear all pages"
                          >
                            None
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={savingUserId === user.id}
                            onClick={() => savePermissions(user.id)}
                            className="text-xs text-violet-400 hover:text-violet-300"
                          >
                            {savingUserId === user.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
