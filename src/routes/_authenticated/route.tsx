import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import type { Role } from "@/lib/gym";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);
    const list = (roles ?? []).map((r) => r.role as Role);
    const order: Role[] = ["ADMIN", "RECEPCION", "ENTRENADOR", "SOCIO"];
    const role: Role = order.find((r) => list.includes(r)) ?? "SOCIO";
    return { user, role, profile };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
