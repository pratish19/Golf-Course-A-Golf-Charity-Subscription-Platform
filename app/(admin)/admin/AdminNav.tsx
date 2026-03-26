"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const navItems = [
    { name: "Draw Engine", href: "/admin" },
    { name: "Users & Subs", href: "/admin/users" },
    { name: "Charity Management", href: "/admin/charities" },
    { name: "Verify Payouts", href: "/admin/payouts" },
  ];

  return (
    <nav className="flex gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 mb-8 w-fit">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            pathname === item.href 
              ? "bg-emerald-500 text-zinc-950 shadow-lg" 
              : "text-zinc-400 hover:text-white hover:bg-zinc-800"
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}