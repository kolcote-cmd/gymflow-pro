import protein from "@/assets/p-protein.jpg";
import drink from "@/assets/p-drink.jpg";
import bar from "@/assets/p-bar.jpg";
import gear from "@/assets/p-gear.jpg";

export type Role = "ADMIN" | "RECEPCION" | "ENTRENADOR" | "SOCIO";

export const productImages: Record<string, string> = {
  protein, creatine: protein, drink, bar, gloves: gear,
};

export const money = (n: number | string | null | undefined) =>
  "$" + Number(n ?? 0).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function daysBetween(fromISO: string, toISO: string) {
  return Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 86400000);
}

export type Sub = { id: string; socio_id: string; fecha_fin: string; estado: string; plan_id: string; planes_membresia?: { nombre: string } | null };

export function activeSub<T extends Sub>(subs: T[] | undefined): T | undefined {
  const t = todayISO();
  return (subs ?? [])
    .filter((s) => s.estado === "ACTIVA" && s.fecha_fin >= t)
    .sort((a, b) => (a.fecha_fin < b.fecha_fin ? 1 : -1))[0];
}

export type SocioStatus = "ACTIVO" | "POR_VENCER" | "VENCIDO" | "INACTIVO";
export function socioStatus(activo: boolean, subs: Sub[] | undefined): { status: SocioStatus; days: number; sub?: Sub } {
  if (!activo) return { status: "INACTIVO", days: 0 };
  const s = activeSub(subs);
  if (!s) return { status: "VENCIDO", days: 0 };
  const days = daysBetween(todayISO(), s.fecha_fin);
  return { status: days <= 7 ? "POR_VENCER" : "ACTIVO", days, sub: s };
}

export const statusStyle: Record<SocioStatus, { label: string; cls: string }> = {
  ACTIVO: { label: "Activo", cls: "bg-success/15 text-success border-success/30" },
  POR_VENCER: { label: "Por vencer", cls: "bg-warning/15 text-warning border-warning/30" },
  VENCIDO: { label: "Vencido", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  INACTIVO: { label: "Inactivo", cls: "bg-muted text-muted-foreground border-border" },
};

export function beep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const tones = ok ? [880, 1320] : [220, 160];
    tones.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = ok ? "sine" : "square";
      o.frequency.value = f;
      g.gain.value = 0.15;
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.15);
      o.stop(ctx.currentTime + i * 0.15 + 0.14);
    });
  } catch { /* noop */ }
}

export const AFORO_MAX = 80;
export const TAX_RATE = 0.12;
