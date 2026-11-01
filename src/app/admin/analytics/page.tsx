"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RefreshCw, TrendingUp, Users, MapPin, CalendarDays, CreditCard } from "lucide-react";

type Metrics = {
  users: number;
  footballers: number;
  owners: number;
  turfs: number;
  approvedTurfs: number;
  bookings: number;
  completedBookings: number;
  pendingBookings: number;
  activeSubscriptions: number;
  pendingSubscriptions: number;
  paidRevenue: number;
};

const initial: Metrics = {
  users: 0,
  footballers: 0,
  owners: 0,
  turfs: 0,
  approvedTurfs: 0,
  bookings: 0,
  completedBookings: 0,
  pendingBookings: 0,
  activeSubscriptions: 0,
  pendingSubscriptions: 0,
  paidRevenue: 0,
};

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.replace("/login?next=/admin/analytics");
        return;
      }

      const { data: admin } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.user.id)
        .single();

      if (admin?.role !== "superadmin") {
        router.replace("/turfs");
        return;
      }

      const [
        users,
        footballers,
        owners,
        turfs,
        approvedTurfs,
        bookings,
        completed,
        pendingBookings,
        activeSubscriptions,
        pendingSubscriptions,
        paidSubscriptions,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "footballer"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "turf_owner"),
        supabase.from("turfs").select("id", { count: "exact", head: true }),
        supabase.from("turfs").select("id", { count: "exact", head: true }).eq("review_status", "approved"),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active").gt("ends_at", new Date().toISOString()),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("subscriptions").select("amount").eq("status", "active").neq("plan_name", "Free Trial"),
      ]);

      const results = [
        users, footballers, owners, turfs, approvedTurfs, bookings,
        completed, pendingBookings, activeSubscriptions,
        pendingSubscriptions, paidSubscriptions,
      ];

      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;

      const revenue = (paidSubscriptions.data ?? []).reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      );

      setMetrics({
        users: users.count ?? 0,
        footballers: footballers.count ?? 0,
        owners: owners.count ?? 0,
        turfs: turfs.count ?? 0,
        approvedTurfs: approvedTurfs.count ?? 0,
        bookings: bookings.count ?? 0,
        completedBookings: completed.count ?? 0,
        pendingBookings: pendingBookings.count ?? 0,
        activeSubscriptions: activeSubscriptions.count ?? 0,
        pendingSubscriptions: pendingSubscriptions.count ?? 0,
        paidRevenue: revenue,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAnalytics(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAnalytics]);

  const cards = [
    { label: "Registered accounts", value: metrics.users, icon: Users },
    { label: "Footballers", value: metrics.footballers, icon: Users },
    { label: "Turf owners", value: metrics.owners, icon: Users },
    { label: "Total turfs", value: metrics.turfs, icon: MapPin },
    { label: "Approved turfs", value: metrics.approvedTurfs, icon: MapPin },
    { label: "Total bookings", value: metrics.bookings, icon: CalendarDays },
    { label: "Completed bookings", value: metrics.completedBookings, icon: CalendarDays },
    { label: "Pending bookings", value: metrics.pendingBookings, icon: CalendarDays },
    { label: "Active subscriptions", value: metrics.activeSubscriptions, icon: CreditCard },
    { label: "Pending subscriptions", value: metrics.pendingSubscriptions, icon: CreditCard },
  ];

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-green-700">
            Business intelligence
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-950">Platform Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor TURFF growth, usage and subscription performance.
          </p>
        </div>
        <button
          onClick={() => void loadAnalytics()}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 font-bold text-gray-800 hover:bg-gray-50"
        >
          <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <section className="rounded-xl bg-green-950 p-7 text-white shadow-sm">
        <div className="flex items-center gap-3 text-green-300">
          <TrendingUp size={22} />
          <p className="text-sm font-bold uppercase tracking-wider">
            Active paid subscription value
          </p>
        </div>
        <p className="mt-4 text-4xl font-black">
          KSh {metrics.paidRevenue.toLocaleString("en-KE")}
        </p>
        <p className="mt-2 text-sm text-green-200">
          Sum of active paid subscription records, excluding free trials.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{card.label}</p>
                <span className="rounded-lg bg-green-50 p-2 text-green-800">
                  <Icon size={19} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-black text-gray-950">
                {loading ? "—" : card.value.toLocaleString("en-KE")}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-black text-gray-950">Platform performance</h2>
        <div className="mt-5 space-y-5">
          {[
            { label: "Completed bookings", value: metrics.completedBookings, total: metrics.bookings },
            { label: "Approved turf listings", value: metrics.approvedTurfs, total: metrics.turfs },
            { label: "Turf owners", value: metrics.owners, total: metrics.users },
          ].map((item) => {
            const percentage = item.total
              ? Math.round((item.value / item.total) * 100)
              : 0;
            return (
              <div key={item.label}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-700">{item.label}</span>
                  <span className="font-bold text-gray-950">{percentage}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {item.value.toLocaleString("en-KE")} of {item.total.toLocaleString("en-KE")}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
