"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  ShieldCheck,
  UserRound,
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AccountRole = "footballer" | "turf_owner" | "superadmin";

type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: AccountRole;
  created_at: string;
};

const PAGE_SIZE = 20;

const roleLabels: Record<AccountRole, string> = {
  footballer: "Footballer",
  turf_owner: "Turf Owner",
  superadmin: "Superadmin",
};

const roleStyles: Record<AccountRole, string> = {
  footballer: "bg-blue-50 text-blue-700 ring-blue-200",
  turf_owner: "bg-green-50 text-green-700 ring-green-200",
  superadmin: "bg-purple-50 text-purple-700 ring-purple-200",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        router.replace("/login?next=/admin/users");
        return;
      }

      const { data: adminProfile, error: adminError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (adminError || adminProfile?.role !== "superadmin") {
        router.replace("/turfs");
        return;
      }

      let query = supabase
        .from("profiles")
        .select("id, full_name, phone, role, created_at", {
          count: "exact",
        });

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }

      const term = search.trim();

      if (term) {
        query = query.ilike("full_name", `%${term}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error: queryError } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (queryError) {
        throw queryError;
      }

      setUsers((data ?? []) as Profile[]);
      setTotal(count ?? 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load registered accounts."
      );
    } finally {
      setLoading(false);
    }
  }, [router, roleFilter, search, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const footballers = users.filter(
    (user) => user.role === "footballer"
  ).length;

  const owners = users.filter(
    (user) => user.role === "turf_owner"
  ).length;

  const superadmins = users.filter(
    (user) => user.role === "superadmin"
  ).length;

  const stats = [
    {
      label: "Accounts on this page",
      value: users.length,
      icon: Users,
      style: "bg-blue-50 text-blue-700",
    },
    {
      label: "Footballers",
      value: footballers,
      icon: UserRound,
      style: "bg-sky-50 text-sky-700",
    },
    {
      label: "Turf owners",
      value: owners,
      icon: Building2,
      style: "bg-green-50 text-green-700",
    },
    {
      label: "Superadmins",
      value: superadmins,
      icon: ShieldCheck,
      style: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="space-y-7">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-green-700">
          Platform management
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-950">
              User Management
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              View registered accounts and monitor their platform roles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <span className={`rounded-lg p-2 ${stat.style}`}>
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-black text-gray-950">
                {stat.value.toLocaleString("en-KE")}
              </p>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Registered accounts
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {total.toLocaleString("en-KE")} matching accounts
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="relative block">
              <span className="sr-only">Search users by full name</span>
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by full name..."
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              />
            </label>

            <label>
              <span className="sr-only">Filter by account role</span>
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }}
                className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800 outline-none focus:border-green-700 focus:ring-2 focus:ring-green-100"
              >
                <option value="all">All account roles</option>
                <option value="footballer">Footballers</option>
                <option value="turf_owner">Turf Owners</option>
                <option value="superadmin">Superadmins</option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading registered accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={34} className="mx-auto text-gray-300" />
            <h3 className="mt-4 font-bold text-gray-900">
              No accounts found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Try changing your search or role filter.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50">
                  <tr className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4">Account</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4">Account ID</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-950">
                          {user.full_name.trim() || "Unnamed account"}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.phone || "Not provided"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${roleStyles[user.role]}`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {user.id.slice(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1 || loading}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm font-semibold text-gray-700">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages || loading}
                  className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="font-bold text-amber-950">
          Account security
        </h3>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          This page is currently read-only. Account roles and privileged
          access are controlled through protected administrative procedures.
          Public users cannot promote themselves to turf owner or superadmin.
        </p>
      </div>
    </div>
  );
}
