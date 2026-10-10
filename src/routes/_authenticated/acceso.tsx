import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, DoorOpen, ScanLine, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allow } from "@/lib/guard";
import { beep, socioStatus } from "@/lib/gym";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/acceso")({
  beforeLoad: allow(["ADMIN", "RECEPCION"]),
  head: () => ({ meta: [{ title: "Control de acceso — IronCore" }, { name: "description", content: "Terminal de check-in y torniquete." }] }),
  component: Acceso,
});

type Result = {
  ok: boolean;
  nombre: string;
  foto?: string | null | undefined;
  plan?: string | undefined;
  dias?: number | undefined;
  motivo?: string | undefined;
  codigo?: string;
};

function Acceso() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  async function check(e?: React.FormEvent) {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;
    setBusy(true);
    const { data: socio } = await supabase
      .from("socios")
      .select("*, suscripciones(id, socio_id, fecha_fin, estado, plan_id, planes_membresia(nombre))")
      .or(`codigo_socio.eq.${term},dni.eq.${term},qr_code.eq.${term}`)
      .maybeSingle();
    setBusy(false);
    setQ("");
    if (!socio) {
      setRes({ ok: false, nombre: "No encontrado", motivo: "Código, DNI o QR no registrado" });
      beep(false);
      return;
    }
    const st = socioStatus(socio.activo, socio.suscripciones);
    const ok = st.status === "ACTIVO" || st.status === "POR_VENCER";
    const motivo = !socio.activo ? "Socio inactivo / dado de baja" : !ok ? "Membresía vencida" : undefined;
    await supabase.from("registros_acceso").insert({ socio_id: socio.id, estado: ok ? "PERMITIDO" : "DENEGADO", motivo_denegado: motivo ?? null });
    setRes({ ok, nombre: `${socio.nombres} ${socio.apellidos}`, foto: socio.foto_url, plan: st.sub?.planes_membresia?.nombre, dias: st.days, motivo, codigo: socio.codigo_socio });
    beep(ok);
    if (ok) openGate();
  }

  function openGate() {
    setOpen(true);
    setTimeout(() => setOpen(false), 3000);
  }

  return (
    <>
      <PageHeader title="Terminal de acceso" subtitle="Escanea QR, tarjeta o ingresa DNI">
        <Button variant="promo" onClick={() => { openGate(); beep(true); toast.success("Torniquete abierto manualmente"); }}>
          <DoorOpen /> Apertura manual
        </Button>
      </PageHeader>

      <form onSubmit={check} className="mx-auto mb-8 flex max-w-2xl gap-2">
        <div className="relative flex-1">
          <ScanLine className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-primary" />
          <Input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="IC-100001 · 45871236 · QR-..." className="h-14 pl-11 font-mono text-lg focus-visible:ring-primary" />
        </div>
        <Button className="h-14 px-6" disabled={busy}><Search /> Validar</Button>
      </form>

      <div
        className={cn(
          "mx-auto grid max-w-2xl place-items-center rounded-2xl border-2 p-8 text-center transition-all duration-500 md:p-12",
          !res && "border-dashed",
          res?.ok && "border-success bg-success/10 glow-success",
          res && !res.ok && "border-destructive bg-destructive/10 glow-danger",
        )}
      >
        {!res ? (
          <div className="py-10 text-muted-foreground">
            <ScanLine className="mx-auto mb-4 size-16 animate-pulse text-primary" />
            <p className="font-display text-xl">Esperando lectura…</p>
            <p className="mt-2 text-sm">Prueba con IC-100001 (activo) o IC-100007 (vencido)</p>
          </div>
        ) : (
          <div className="animate-in zoom-in-95">
            {res.ok ? <CheckCircle2 className="mx-auto size-16 text-success" /> : <XCircle className="mx-auto size-16 text-destructive" />}
            <p className={cn("mt-2 font-display text-4xl font-bold md:text-5xl", res.ok ? "text-success" : "text-destructive")}>
              {res.ok ? "Acceso aprobado" : "Acceso denegado"}
            </p>
            {res.foto && <img src={res.foto} alt="" className={cn("mx-auto mt-6 size-32 rounded-full border-4 object-cover", res.ok ? "border-success" : "border-destructive")} />}
            <p className="mt-4 text-2xl font-semibold">{res.nombre}</p>
            {res.codigo && <p className="font-mono text-sm text-muted-foreground">{res.codigo}</p>}
            {res.ok ? (
              <div className="mt-4 flex justify-center gap-6">
                <div><p className="text-xs uppercase text-muted-foreground">Plan</p><p className="font-semibold">{res.plan}</p></div>
                <div><p className="text-xs uppercase text-muted-foreground">Días restantes</p><p className={cn("font-display text-2xl", (res.dias ?? 0) <= 7 ? "text-warning" : "text-success")}>{res.dias}</p></div>
              </div>
            ) : (
              <p className="mt-4 rounded-md bg-destructive/20 px-4 py-2 font-semibold text-destructive">{res.motivo}</p>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-3 text-sm">
        <span className={cn("size-3 rounded-full transition-colors", open ? "bg-success glow-success" : "bg-destructive")} />
        Torniquete: <b className={open ? "text-success" : "text-muted-foreground"}>{open ? "ABIERTO" : "CERRADO"}</b>
      </div>
    </>
  );
}
