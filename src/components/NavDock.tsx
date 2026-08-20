"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", icon: "fa-house-chimney", label: "Home" },
  { href: "/mining", icon: "fa-atom", label: "Trading" },
  { href: "/team", icon: "fa-diagram-project", label: "Team" },
  { href: "/profile", icon: "fa-id-badge", label: "Profile" },
];

export default function NavDock() {
  const pathname = usePathname();

  return (
    <nav className="nav-dock">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex flex-col items-center gap-1 flex-1 transition-colors ${
            pathname === link.href ? "text-[#0071e3] -translate-y-1" : "text-[#a1a1a6]"
          }`}
        >
          <i className={`fa-solid ${link.icon} text-xl`} />
          <span className="text-[0.65rem] font-bold uppercase tracking-wide">
            {link.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
