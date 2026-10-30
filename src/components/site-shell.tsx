import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="text-2xl font-black tracking-tight text-green-800">
          TURFF<span className="text-green-600">.</span>
        </Link>

        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium text-gray-700">
          <Link href="/turfs" className="hover:text-green-700">Find a turf</Link>
          <Link href="/pricing" className="hover:text-green-700">For owners</Link>
          <Link href="/about" className="hover:text-green-700">About</Link>
          <Link href="/contact" className="hover:text-green-700">Contact</Link>
          <Link href="/login" className="rounded-md border border-gray-300 px-4 py-2 hover:border-green-700 hover:text-green-800">
            Log in
          </Link>
          <Link href="/register" className="rounded-md bg-green-800 px-4 py-2 text-white hover:bg-green-900">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="text-2xl font-black text-green-800">TURFF.</Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-gray-600">
            Find football pitches, explore your options and organise your next game.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/turfs" className="hover:text-green-800">Find a turf</Link></li>
            <li><Link href="/about" className="hover:text-green-800">About TURFF</Link></li>
            <li><Link href="/pricing" className="hover:text-green-800">For turf owners</Link></li>
            <li><Link href="/contact" className="hover:text-green-800">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Account</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/login" className="hover:text-green-800">Log in</Link></li>
            <li><Link href="/register" className="hover:text-green-800">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-bold text-gray-900">Legal</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li><Link href="/privacy" className="hover:text-green-800">Privacy policy</Link></li>
            <li><Link href="/terms" className="hover:text-green-800">Terms and conditions</Link></li>
            <li><Link href="/cookies" className="hover:text-green-800">Cookie policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 px-5 py-5 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} TURFF. All rights reserved.
      </div>
    </footer>
  );
}

export function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
    </>
  );
}
