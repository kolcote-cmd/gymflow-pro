import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CalendarClock, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { allow } from "@/lib/guard";
import { AFORO_MAX, money, todayISO } from "@/lib/gym";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: allow(["ADMIN", "RECEPCION"]),
  head: () => ({ meta: [{ title: "Dashboard — IronCore" }, { name: "description", content: "Panel ejecutivo del gimnasio." }] }),
  component: Dashboard,
});

async function loadDashboard() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const since14 = new Date(Date.now() - 14 * 86400000).toISOString();
  const since6m = new Date(); since6m.setMonth(since6m.getMonth() - 5); since6m.setDate(1); since6m.setHours(0, 0, 0, 0);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [acc, subsToday, ventasToday, porVencer, hist, subsM, ventasM, feed] = await Promise.all([
    supabase.from("registros_acceso").select("socio_id, fecha_hora, salida").eq("estado", "PERMITIDO").gte("fecha_hora", start.toISOString()),
    supabase.from("suscripciones").select("total_pagado").gte("created_at", start.toISOString()),
    supabase.from("ventas_pos").select("total").gte("fecha_hora", start.toISOString()),
    supabase.from("suscripciones").select("id", { count: "exact", head: true }).eq("estado", "ACTIVA").gte("fecha_fin", todayISO()).lte("fecha_fin", in7),
    supabase.from("registros_acceso").select("fecha_hora").eq("estado", "PERMITIDO").gte("fecha_hora", since14),
    supabase.from("suscripciones").select("total_pagado, created_at").gte("created_at", since6m.toISOString()),
    supabase.from("ventas_pos").select("total, fecha_hora").gte("fecha_hora", since6m.toISOString()),
    supabase.from("registros_acceso").select("id, fecha_hora, estado, motivo_denegado, socios(nombres, apellidos, foto_url)").order("fecha_hora", { ascending: false }).limit(10),
  ]);
  const twoH = Date.now() - 2 * 3600000;
  const aforo = (acc.data ?? []).filter((r) => !r.salida && new Date(r.fecha_hora).getTime() > twoH).length;
  const activosHoy = new Set((acc.data ?? []).map((r) => r.socio_id)).size;
  const ingresos = (subsToday.data ?? []).reduce((a, r) => a + Number(r.total_pagado), 0) + (ventasToday.data ?? []).reduce((a, r) => a + Number(r.total), 0);

  const hours = Array.from({ length: 18 }, (_, i) => ({ hora: `${String(i + 5).padStart(2, "0")}:00`, socios: 0 }));
  (hist.data ?? []).forEach((r) => { const h = new Date(r.fecha_hora).getHours(); const idx = h - 5; if (hours[idx]) hours[idx].socios++; });
  hours.forEach((h) => (h.socios = Math.round((h.socios / 14) * 10) / 10));

  const months: { mes: string; key: string; Suscripciones: number; Tienda: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    months.push({ mes: d.toLocaleString("es", { month: "short" }).toUpperCase(), key: `${d.getFullYear()}-${d.getMonth()}`, Suscripciones: 0, Tienda: 0 });
  }
  const mk = (s: string) => { const d = new Date(s); return `${d.getFullYear()}-${d.getMonth()}`; };
  (subsM.data ?? []).forEach((r) => { const m = months.find((x) => x.key === mk(r.created_at)); if (m) m.Suscripciones += Number(r.total_pagado); });
  (ventasM.data ?? []).forEach((r) => { const m = months.find((x) => x.key === mk(r.fecha_hora)); if (m) m.Tienda += Number(r.total); });

  return { aforo, activosHoy, ingresos, porVencer: porVencer.count ?? 0, hours, months, feed: feed.data ?? [] };
}

function Dashboard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: loadDashboard, refetchInterval: 30000 });
  useEffect(() => {
    const ch = supabase.channel("dash-access").on("postgres_changes", { event: "*", schema: "public", table: "registros_acceso" }, () => qc.invalidateQueries({ queryKey: ["dashboard"] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const pct = data ? Math.min(100, (data.aforo / AFORO_MAX) * 100) : 0;
  const kpis = [
    { label: "Socios activos hoy", value: data?.activosHoy ?? "—", icon: Users, tone: "text-primary" },
    { label: "Aforo en sala", value: data ? `${data.aforo}/${AFORO_MAX}` : "—", icon: Activity, tone: "text-success", bar: pct },
    { label: "Ingresos del día", value: data ? money(data.ingresos) : "—", icon: DollarSign, tone: "text-primary" },
    { label: "Vencen en 7 días", value: data?.porVencer ?? "—", icon: CalendarClock, tone: "text-promo" },
  ];

  return (
    <>
      <PageHeader title="Dashboard ejecutivo" subtitle="Métricas en tiempo real del gimnasio" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/50">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <k.icon className={cn("size-5", k.tone)} />
            </div>
            <p className={cn("mt-3 font-display text-3xl font-bold", k.tone)}>{k.value}</p>
            {k.bar !== undefined && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full transition-all", pct > 85 ? "bg-destructive" : pct > 60 ? "bg-warning" : "bg-success")} style={{ width: `${k.bar}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-sm">Afluencia promedio por hora</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <AreaChart data={data?.hours ?? []}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="hora" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)" }} />
                  <Area type="monotone" dataKey="socios" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-4 text-sm">Ingresos mensuales: suscripciones vs tienda</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data?.months ?? []}>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                  <XAxis dataKey="mes" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip formatter={(v: number) => money(v)} contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)" }} cursor={{ fill: "var(--color-accent)" }} />
                  <Legend />
                  <Bar dataKey="Suscripciones" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Tienda" fill="var(--color-promo)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm">Últimos check-ins</h3>
            <span className="flex items-center gap-1.5 text-xs text-success"><span className="size-2 animate-pulse rounded-full bg-success" />En vivo</span>
          </div>
          <ul className="space-y-3">
            {data?.feed.map((r) => (
              <li key={r.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                <img src={r.socios?.foto_url ?? ""} alt="" className={cn("size-10 rounded-full border-2 object-cover", r.estado === "PERMITIDO" ? "border-success" : "border-destructive")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.socios?.nombres} {r.socios?.apellidos}</p>
                  <p className={cn("text-xs", r.estado === "PERMITIDO" ? "text-success" : "text-destructive")}>{r.estado === "PERMITIDO" ? "Acceso permitido" : r.motivo_denegado}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">{new Date(r.fecha_hora).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
