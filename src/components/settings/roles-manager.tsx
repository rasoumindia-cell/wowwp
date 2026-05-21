"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function RolesManager() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [users, setUsers] = useState<ProfileWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin(profile)) return;
    loadUsers();
  }, [profile]);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, page_permissions")
      .order("email");
    if (error) {
      toast.error("Failed to load users");
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

  async function savePermissions(userId: string) {
    setSavingUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ page_permissions: user.page_permissions ?? [] })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to save permissions");
    } else {
      toast.success("Permissions saved");
    }
    setSavingUserId(null);
  }

  async function toggleRole(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const nextRole = user.role === "admin" ? "user" : "admin";
    const { error } = await supabase
      .from("profiles")
      .update({ role: nextRole })
      .eq("id", userId);
    if (error) {
      toast.error("Failed to update role");
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u)),
      );
      toast.success(`Role changed to ${nextRole}`);
    }
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

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-violet-500" />
          Staff & Roles
        </CardTitle>
        <CardDescription className="text-slate-400">
          Assign page-level access to each user. Admins have access to
          everything.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              {ALL_PAGES.map((page) => (
                <TableHead key={page} className="text-center text-slate-400">
                  {PAGE_LABELS[page]}
                </TableHead>
              ))}
              <TableHead className="text-slate-400" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const perms = user.page_permissions ?? [];
              return (
                <TableRow key={user.id} className="border-slate-800">
                  <TableCell className="text-white">
                    <div className="text-sm font-medium">{user.full_name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRole(user.id)}
                      disabled={user.id === profile?.id}
                      className={`border-slate-700 text-xs ${
                        user.role === "admin"
                          ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </Button>
                  </TableCell>
                  {ALL_PAGES.map((page) => {
                    const checked = user.role === "admin" || perms.includes(page);
                    return (
                      <TableCell key={page} className="text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={user.role === "admin"}
                          onChange={() => togglePage(user.id, page)}
                          className="h-4 w-4 accent-violet-500"
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={
                        user.role === "admin" || savingUserId === user.id
                      }
                      onClick={() => savePermissions(user.id)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {savingUserId === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
