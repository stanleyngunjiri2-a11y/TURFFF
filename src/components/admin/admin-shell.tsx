"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MapPin,
  CalendarDays,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "PLATFORM MANAGEMENT",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Owner applications",
        href: "/admin/applications",
        icon: ClipboardList,
      },
      {
        label: "Turf listings",
        href: "/admin/turfs",
        icon: MapPin,
      },
      {
        label: "Bookings",
        href: "/admin/bookings",
        icon: CalendarDays,
        disabled: true,
      },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      {
        label: "Subscriptions",
        href: "/admin/subscriptions",
        icon: CreditCard,
      },
      {
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        disabled: true,
      },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [
      {
        label: "Settings",
        href: "/admin/settings",
        icon: Settings,
        disabled: true,
      },
    ],
  },
];

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoggingOut(false);
      window.alert("Could not sign out. Please try again.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  function renderSidebarContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center border-b border-gray-800 px-6">
          <Link
            href="/admin/dashboard"
            className="text-2xl font-black tracking-tight text-white"
          >
            TURFF<span className="text-green-400">.</span>
            <span className="ml-2 text-xs font-semibold tracking-wider text-gray-400">
              ADMIN
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-7">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.18em] text-gray-500">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    (item.href !== "/admin/dashboard" &&
                      pathname.startsWith(`${item.href}/`));

                  if (item.disabled) {
                    return (
                      <div
                        key={item.href}
                        title="This section is not available yet."
                        className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-3 text-sm font-medium text-gray-600"
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={18} />
                          {item.label}
                        </span>
                        <span className="rounded bg-gray-800 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                          Soon
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-green-800 text-white shadow-lg shadow-green-950/30"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <Link
            href="/turfs"
            className="mb-2 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <ExternalLink size={17} />
            View public website
          </Link>

          <button
            type="button"
            onClick={() => void logout()}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-red-300 hover:bg-red-950/40 disabled:opacity-50"
          >
            <LogOut size={17} />
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-800 bg-gray-950 lg:block">
        {renderSidebarContent()}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-gray-950">
            <div className="absolute right-3 top-5 z-10">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-white hover:bg-gray-800"
              >
                <X size={22} />
              </button>
            </div>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                TURFF / Administration
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900">
                Superadmin workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-gray-900">Superadmin</p>
              <p className="max-w-56 truncate text-xs text-gray-500">
                {email}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-black text-green-800">
              A
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] p-4 sm:p-7 lg:p-9">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>

        <footer className="border-t border-gray-200 bg-white px-6 py-4 text-center text-xs text-gray-500 lg:text-left">
          TURFF Administration · Secure platform management
        </footer>
      </div>
    </div>
  );
}
