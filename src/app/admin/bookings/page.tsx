"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { RefreshCw, CalendarDays } from "lucide-react";

type Booking = {
  id: string;
  turf_id: string;
  customer_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  player_count: number | null;
  customer_note: string;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  created_at: string;
};

type Turf = {
  id: string;
  name: string;
  county: string;
  town: string;
  owner_id: string;
};

type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
};

const badge = (value: string) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-700",
    completed: "bg-blue-100 text-blue-800",
    unpaid: "bg-gray-100 text-gray-700",
    pending_verification: "bg-amber-100 text-amber-800",
    verified: "bg-green-100 text-green-800",
  };

  return styles[value] ?? "bg-gray-100 text-gray-700";
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [turfs, setTurfs] = useState<Record<string, Turf>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: auth } = await supabase.auth.getUser();

      if (!auth.user) {
        router.replace("/login?next=/admin/bookings");
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

      const { data, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (bookingError) throw bookingError;

      const rows = (data ?? []) as Booking[];
      setBookings(rows);

      const turfIds = [...new Set(rows.map((b) => b.turf_id))];
      const customerIds = [...new Set(rows.map((b) => b.customer_id))];

      if (turfIds.length) {
        const { data: turfData, error: turfError } = await supabase
          .from("turfs")
          .select("id,name,county,town,owner_id")
          .in("id", turfIds);

        if (turfError) throw turfError;

        const mapped: Record<string, Turf> = {};
        (turfData ?? []).forEach((t) => {
          mapped[t.id] = t as Turf;
        });
        setTurfs(mapped);
      } else {
        setTurfs({});
      }

      if (customerIds.length) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id,full_name,phone")
          .in("id", customerIds);

        if (profileError) throw profileError;

        const mapped: Record<string, Profile> = {};
        (profileData ?? []).forEach((p) => {
          mapped[p.id] = p as Profile;
        });
        setProfiles(mapped);
      } else {
        setProfiles({});
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load bookings."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBookings(), 0);
    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  const filtered = bookings.filter(
    (booking) => filter === "all" || booking.status === filter
  );

  const stats = [
    { label: "All bookings", value: bookings.length },
    { label: "Pending", value: bookings.filter((b) => b.status === "pending").length },
    { label: "Approved", value: bookings.filter((b) => b.status === "approved").length },
    { label: "Completed", value: bookings.filter((b) => b.status === "completed").length },
  ];

  return (
    <div className="space-y-7">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-green-700">
            Platform management
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-950">
            All Bookings
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor bookings made across every registered turf.
          </p>
        </div>

        <button
          onClick={() => void loadBookings()}
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-black text-gray-950">
              {stat.value.toLocaleString("en-KE")}
            </p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-black text-gray-950">
              Platform booking records
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} matching records
            </p>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays size={36} className="mx-auto text-gray-300" />
            <p className="mt-4 font-bold text-gray-900">No bookings found</p>
            <p className="mt-2 text-sm text-gray-500">
              Booking records will appear here when customers make reservations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Turf</th>
                  <th className="px-5 py-4">Booking date</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Players</th>
                  <th className="px-5 py-4">Booking status</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((booking) => {
                  const customer = profiles[booking.customer_id];
                  const turf = turfs[booking.turf_id];

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">
                          {customer?.full_name || "Unknown customer"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer?.phone || "No phone provided"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">
                          {turf?.name || "Unknown turf"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {[turf?.town, turf?.county].filter(Boolean).join(", ")}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {booking.booking_date}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {booking.start_time.slice(0, 5)}–{booking.end_time.slice(0, 5)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {booking.player_count ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge(booking.payment_status)}`}>
                          {booking.payment_status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-600">
                        {booking.payment_reference || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-gray-500">
        This is a platform-wide monitoring page. Booking approvals and payment
        verification remain subject to the existing protected booking workflows.
      </p>
    </div>
  );
}
