"use client";

import { Search, Network, Activity, Package, Cable } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Live", href: "/live", icon: Cable },
  { name: "Search", href: "/search", icon: Search },
  { name: "Connections", href: "/connections", icon: Network },
  { name: "Streams", href: "/streams", icon: Activity },
  { name: "Schema Bundles", href: "/schema-bundles", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed left-0 top-0 z-50
        h-screen w-[280px]
        border-r border-border
        bg-background-card
        flex flex-col
        p-4
      "
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/40 transition"
      >
        <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold">
          CS
        </div>

        <span className="font-semibold text-sm tracking-tight">
          ControlStream
        </span>
      </Link>

      {/* Menu */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-border pt-4 px-2">
        <p className="text-xs text-text-secondary">v1.0.0 Alpha</p>
      </div>
    </aside>
  );
}
