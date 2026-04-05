"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PlusCircle,
  Upload,
  FileText,
  Settings,
  ShieldCheck,
  LogOut,
  Bell,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/new-verification", label: "New Verification", icon: PlusCircle },
  { href: "/bulk-upload", label: "Bulk Upload", icon: Upload },
  { href: "/results", label: "Results", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name || (session?.user as any)?.companyName || "Admin User";
  const userEmail = session?.user?.email || "admin@verifyiq.com";

  return (
    <aside className="w-64 shrink-0 h-screen flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border sticky top-0">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #667eea 0%, #f07b6c 100%)" }}>
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm tracking-wide">VerifyIQ</p>
            <p className="text-xs text-sidebar-foreground/50">BGV Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1" data-testid="sidebar-nav">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-primary text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1 border-t border-sidebar-border pt-4">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150" data-testid="btn-notifications">
          <Bell className="w-4 h-4" />
          Notifications
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
          data-testid="btn-logout"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #667eea, #f07b6c)" }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
