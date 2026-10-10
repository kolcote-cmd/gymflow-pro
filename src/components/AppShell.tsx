import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, ScanLine, Users, CreditCard, ShoppingCart, Dumbbell, Settings, LogOut,
  ChevronsLeft, Menu, Zap, UserCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/gym";
import { Button } from "@/components/ui/button";

const NAV: { to: string; label: string; icon: typeof Zap; roles: Role[] }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "RECEPCION"] },
  { to: "/acceso", label: "Control de acceso", icon: ScanLine, roles: ["ADMIN", "RECEPCION"] },
  { to: "/socios", label: "Socios", icon: Users, roles: ["ADMIN", "RECEPCION", "ENTRENADOR"] },
  { to: "/membresias", label: "Membresías & cobros", icon: CreditCard, roles: ["ADMIN", "RECEPCION"] },
  { to: "/pos", label: "Tienda POS", icon: ShoppingCart, roles: ["ADMIN", "RECEPCION"] },
  { to: "/rutinas", label: "Rutinas & evaluaciones", icon: Dumbbell, roles: ["ADMIN", "ENTRENADOR"] },
  { to: "/configuracion", label: "Configuración", icon: Settings, roles: ["ADMIN"] },
  { to: "/portal", label: "Mi portal", icon: UserCircle, roles: ["SOCIO"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { role, profile, user } = useRouteContext({ from: "/_authenticated" });
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = NAV.filter((n) => n.roles.includes(role));
  const sidebar = (
    <aside className={cn("flex h-full flex-col border-r bg-sidebar transition-all duration-300", collapsed ? "w-[72px]" : "w-64")}>
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Zap className="size-5" /></div>
        {!collapsed && <span className="font-display text-xl font-bold">Iron<span className="text-primary">Core</span></span>}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setMobile(false)}
            className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeProps={{ className: "!bg-primary/10 !text-primary border-l-2 border-primary" }}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        {!collapsed && (
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-semibold">{profile?.full_name ?? user.email}</p>
            <span className="font-mono text-[10px] text-primary">{role}</span>
          </div>
        )}
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="size-5 shrink-0" />{!collapsed && "Cerrar sesión"}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="mt-1 hidden w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent lg:flex">
          <ChevronsLeft className={cn("size-5 shrink-0 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Colapsar"}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">{sidebar}</div>
      {mobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="animate-in slide-in-from-left">{sidebar}</div>
          <div className="flex-1 bg-background/70 backdrop-blur-sm" onClick={() => setMobile(false)} />
        </div>
      )}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobile(true)}><Menu /></Button>
          <span className="font-display text-lg font-bold">Iron<span className="text-primary">Core</span></span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 animate-in fade-in">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 h-1 w-12 bg-primary" />
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
