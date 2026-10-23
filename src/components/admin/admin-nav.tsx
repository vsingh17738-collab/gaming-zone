"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CreditCard, Images, LayoutDashboard, MessageSquareText, PackageOpen, Settings, TentTree, ClipboardList } from "lucide-react";

const items = [
  ["Overview", "/admin", LayoutDashboard], ["Bookings", "/admin/bookings", ClipboardList], ["Calendar", "/admin/calendar", CalendarDays],
  ["Payments", "/admin/payments", CreditCard], ["Services", "/admin/services", TentTree], ["Packages", "/admin/packages", PackageOpen],
  ["Gallery", "/admin/gallery", Images], ["Reviews", "/admin/reviews", MessageSquareText], ["Settings", "/admin/settings", Settings],
] as const;
export function AdminNav() { const pathname = usePathname(); return <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">{items.map(([label, href, Icon]) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-xs font-semibold transition ${active ? "bg-wine text-white" : "text-stone-500 hover:bg-wine-light hover:text-wine"}`}><Icon size={17} />{label}</Link>; })}</nav>; }
