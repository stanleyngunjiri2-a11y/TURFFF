"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Settings, ShieldCheck, Database, CreditCard, CalendarDays } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/login?next=/admin/settings");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "superadmin") {
        router.replace("/turfs");
        return;
      }

      if (active) {
        setEmail(data.user.email ?? "");
        setLoading(false);
      }
    }

    void checkAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  const sections = [
    {
      icon: ShieldCheck,
      title: "Administrator access",
      description: "The Superadmin workspace is restricted to accounts with the superadmin database role.",
      value: "Protected",
    },
    {
      icon: Database,
      title: "Database",
      description: "TURFF uses Supabase for authentication, database records and row-level security.",
      value: "Supabase",
    },
    {
      icon: CalendarDays,
      title: "Booking workflow",
      description: "Turfs can use manual owner approval or instant booking, subject to availability and subscription checks.",
      value: "Hybrid booking",
    },
    {
      icon: CreditCard,
      title: "Owner subscriptions",
      description: "Subscription payments are submitted using M-Pesa references and verified through the protected administrative workflow.",
      value: "Manual verification",
    },
  ];

  if (loading) {
    return <div className="p-10 text-gray-600">Loading platform settings...</div>;
  }

  return (
    <div className="space-y-7">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-green-700">
          Configuration
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-950">
          Platform Settings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Review the current TURFF platform configuration and administration controls.
        </p>
      </section>

      <section className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-green-100 p-3 text-green-800">
            <Settings size={24} />
          </span>
          <div>
            <h2 className="font-black text-green-950">Superadmin account</h2>
            <p className="mt-1 text-sm text-green-900">{email}</p>
            <p className="mt-2 text-sm text-green-800">
              You are viewing the platform administration workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <article key={section.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-lg bg-green-50 p-3 text-green-800">
                  <Icon size={22} />
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                  {section.value}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-black text-gray-950">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {section.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-black text-amber-950">Security notice</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Privileged account roles, subscription verification and booking
          status transitions are controlled through protected database
          operations. Do not expose Supabase service-role credentials in
          browser code.
        </p>
      </section>
    </div>
  );
}
