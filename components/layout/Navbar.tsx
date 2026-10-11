"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useView } from "./ViewProvider";

const links = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Projects", href: "/projects" },
  { label: "Conversations", href: "/conversations" },
];

export default function Navbar() {
  const { view, setView } = useView();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-4 md:px-8 md:py-5">
      <Link href="/" className="text-2xl font-bold text-emerald-700">
        JanDrishti
      </Link>

      <div className="hidden gap-8 text-sm font-medium md:flex">
        {links.map((l) => {
          const active =
            l.href === "/projects" || l.href === "/conversations"
              ? pathname.startsWith(l.href)
              : l.href === "/" && pathname === "/";
          return (
            <Link
              key={l.label}
              href={l.href}
              className={`transition-colors hover:text-emerald-700 ${
                active ? "text-emerald-700" : "text-slate-600"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setView("citizen")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            view === "citizen"
              ? "bg-emerald-700 text-white"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          Citizen
        </button>

        <button
          onClick={() => setView("authority")}
          className={`rounded-md px-3 py-2 text-sm font-medium ${
            view === "authority"
              ? "bg-emerald-700 text-white"
              : "text-slate-600 hover:bg-white"
          }`}
        >
          Authority
        </button>
      </div>
    </nav>
  );
}
