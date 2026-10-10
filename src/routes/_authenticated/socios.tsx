import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Camera, Eye, Pencil, Plus, RefreshCw, Search, Upload, UserX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allow } from "@/lib/guard";
import { money, socioStatus, statusStyle, type SocioStatus } from "@/lib/gym";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/socios")({
  beforeLoad: allow(["ADMIN", "RECEPCION", "ENTRENADOR"]),
  head: () => ({ meta: [{ title: "Socios — IronCore" }, { name: "description", content: "Gestión integral de socios." }] }),
  component: Socios,
});

const SELECT = "*, suscripciones(id, socio_id, fecha_fin, fecha_inicio, estado, plan_id, total_pagado, planes_membresia(nombre))";
const fetchSocios = async () => {
  const { data, error } = await supabase.from("socios").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};
type Socio = Awaited<ReturnType<typeof fetchSocios>>[number];

const FILTERS: { k: "ALL" | SocioStatus | "DEUDOR"; l: string }[] = [
  { k: "ALL", l: "Todos" }, { k: "ACTIVO", l: "Activos" }, { k: "POR_VENCER", l: "Por vencer" }, { k: "DEUDOR", l: "Inactivos / Deudores" },
];

function Socios() {
  const { role } = useRouteContext({ from: "/_authenticated" });
  const canEdit = role === "ADMIN" || role === "RECEPCION";
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["socios"], queryFn: fetchSocios });
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]["k"]>("ALL");
  const [edit, setEdit] = useState<Partial<Socio> | null>(null);
  const [view, setView] = useState<Socio | null>(null);

  const rows = useMemo(() => {
    const t = q.toLowerCase();
    return data
      .map((s) => ({ s, st: socioStatus(s.activo, s.suscripciones) }))
      .filter(({ s }) => !t || [s.nombres, s.apellidos, s.telefono, s.qr_code, s.dni, s.codigo_socio].some((v) => v?.toLowerCase().includes(t)))
      .filter(({ st }) => f === "ALL" || (f === "DEUDOR" ? st.status === "VENCIDO" || st.status === "INACTIVO" : st.status === f));
  }, [data, q, f]);

  async function baja(s: Socio) {
    const { error } = await supabase.from("socios").update({ activo: !s.activo }).eq("id", s.id);
    if (error) { toast.error(error.message); return; }
    toast.success(s.activo ? "Socio dado de baja" : "Socio reactivado");
    qc.invalidateQueries({ queryKey: ["socios"] });
  }

  return (
    <>
      <PageHeader title="Socios" subtitle={`${data.length} registrados`}>
        {canEdit && <Button onClick={() => setEdit({})}><Plus /> Nuevo socio</Button>}
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, teléfono, QR o DNI" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((x) => (
            <button key={x.k} onClick={() => setF(x.k)} className={cn("rounded-md border px-3 py-1.5 text-sm transition-colors", f === x.k ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
              {x.l}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Socio</th><th className="p-3">Código</th><th className="hidden p-3 md:table-cell">DNI</th><th className="hidden p-3 md:table-cell">Teléfono</th><th className="p-3">Plan</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Cargando…</td></tr>}
            {rows.map(({ s, st }) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-accent/40">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={s.foto_url ?? ""} alt="" className="size-9 rounded-full bg-muted object-cover" />
                    <span className="font-medium">{s.nombres} {s.apellidos}</span>
                  </div>
                </td>
                <td className="p-3 font-mono text-xs">{s.codigo_socio}</td>
                <td className="hidden p-3 md:table-cell">{s.dni}</td>
                <td className="hidden p-3 md:table-cell">{s.telefono}</td>
                <td className="p-3">{st.sub?.planes_membresia?.nombre ?? "—"}{st.sub && <span className="block text-xs text-muted-foreground">{st.days} días</span>}</td>
                <td className="p-3"><span className={cn("rounded-full border px-2 py-0.5 text-xs", statusStyle[st.status].cls)}>{statusStyle[st.status].label}</span></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setView(s)} title="Expediente"><Eye /></Button>
                    {canEdit && <>
                      <Button size="icon" variant="ghost" asChild title="Renovar"><Link to="/membresias" search={{ socio: s.id }}><RefreshCw /></Link></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEdit(s)} title="Editar"><Pencil /></Button>
                      <Button size="icon" variant="ghost" onClick={() => baja(s)} title={s.activo ? "Dar de baja" : "Reactivar"}><UserX className={s.activo ? "text-destructive" : "text-success"} /></Button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && <SocioForm socio={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); qc.invalidateQueries({ queryKey: ["socios"] }); }} />}
      {view && <Expediente socio={view} onClose={() => setView(null)} />}
    </>
  );
}

function SocioForm({ socio, onClose, onSaved }: { socio: Partial<Socio>; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState({
    nombres: socio.nombres ?? "", apellidos: socio.apellidos ?? "", dni: socio.dni ?? "", telefono: socio.telefono ?? "",
    email: socio.email ?? "", contacto_emergencia: socio.contacto_emergencia ?? "", foto_url: socio.foto_url ?? "",
    notas_medicas: socio.notas_medicas ?? "", alergias: socio.alergias ?? "", observaciones: socio.observaciones ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [cam, setCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  function toDataUrl(src: CanvasImageSource, w: number, h: number) {
    const c = document.createElement("canvas");
    const size = 256; c.width = size; c.height = size;
    const s = Math.min(w, h);
    c.getContext("2d")!.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL("image/jpeg", 0.8);
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const img = new Image();
    img.onload = () => setV((p) => ({ ...p, foto_url: toDataUrl(img, img.width, img.height) }));
    img.src = URL.createObjectURL(file);
  }
  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCam(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 50);
    } catch { toast.error("No se pudo acceder a la cámara"); }
  }
  function snap() {
    const vid = videoRef.current; if (!vid) return;
    setV((p) => ({ ...p, foto_url: toDataUrl(vid, vid.videoWidth, vid.videoHeight) }));
    (vid.srcObject as MediaStream)?.getTracks().forEach((t) => t.stop());
    setCam(false);
  }

  async function save() {
    if (!v.nombres || !v.apellidos) { toast.error("Nombres y apellidos son obligatorios"); return; }
    setSaving(true);
    const payload = { ...v, dni: v.dni || null };
    const { error } = socio.id
      ? await supabase.from("socios").update(payload).eq("id", socio.id)
      : await supabase.from("socios").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(socio.id ? "Socio actualizado" : "Socio registrado");
    onSaved();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{socio.id ? "Editar socio" : "Registrar socio"}</DialogTitle></DialogHeader>
        <Tabs defaultValue="datos">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="datos">Datos personales</TabsTrigger>
            <TabsTrigger value="foto">Foto & QR</TabsTrigger>
            <TabsTrigger value="medica">Ficha médica</TabsTrigger>
          </TabsList>
          <TabsContent value="datos" className="grid gap-3 pt-4 sm:grid-cols-2">
            <F l="Nombres"><Input value={v.nombres} onChange={set("nombres")} /></F>
            <F l="Apellidos"><Input value={v.apellidos} onChange={set("apellidos")} /></F>
            <F l="Documento (DNI)"><Input value={v.dni} onChange={set("dni")} /></F>
            <F l="Teléfono"><Input value={v.telefono} onChange={set("telefono")} /></F>
            <F l="Correo"><Input type="email" value={v.email} onChange={set("email")} /></F>
            <F l="Contacto de emergencia"><Input value={v.contacto_emergencia} onChange={set("contacto_emergencia")} /></F>
          </TabsContent>
          <TabsContent value="foto" className="grid gap-6 pt-4 sm:grid-cols-2">
            <div className="space-y-3">
              {cam ? <video ref={videoRef} className="aspect-square w-full rounded-lg bg-muted object-cover" muted /> : (
                <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg border bg-muted">
                  {v.foto_url ? <img src={v.foto_url} alt="" className="size-full object-cover" /> : <Camera className="size-10 text-muted-foreground" />}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild><label className="cursor-pointer"><Upload /> Subir<input type="file" accept="image/*" hidden onChange={onFile} /></label></Button>
                {cam ? <Button size="sm" onClick={snap}>Capturar</Button> : <Button variant="outline" size="sm" onClick={startCam}><Camera /> Webcam</Button>}
              </div>
            </div>
            <div className="grid place-items-center rounded-lg border p-4">
              {socio.qr_code ? (
                <><div className="rounded bg-foreground p-3"><QRCode value={socio.qr_code} size={150} /></div><p className="mt-2 font-mono text-[10px] text-muted-foreground">{socio.qr_code}</p></>
              ) : <p className="text-center text-sm text-muted-foreground">El código QR único se genera automáticamente al guardar.</p>}
            </div>
          </TabsContent>
          <TabsContent value="medica" className="space-y-3 pt-4">
            <F l="Padecimientos"><Textarea value={v.notas_medicas} onChange={set("notas_medicas")} /></F>
            <F l="Alergias"><Textarea value={v.alergias} onChange={set("alergias")} /></F>
            <F l="Observaciones"><Textarea value={v.observaciones} onChange={set("observaciones")} /></F>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Expediente({ socio, onClose }: { socio: Socio; onClose: () => void }) {
  const st = socioStatus(socio.activo, socio.suscripciones);
  const { data: accesos } = useQuery({
    queryKey: ["accesos", socio.id],
    queryFn: async () => (await supabase.from("registros_acceso").select("*").eq("socio_id", socio.id).order("fecha_hora", { ascending: false }).limit(8)).data ?? [],
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Expediente</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="text-center">
            <img src={socio.foto_url ?? ""} alt="" className="mx-auto size-28 rounded-full border-2 border-primary object-cover" />
            <div className="mt-3 inline-block rounded bg-foreground p-2"><QRCode value={socio.qr_code} size={96} /></div>
          </div>
          <div className="flex-1 space-y-1 text-sm">
            <p className="font-display text-2xl">{socio.nombres} {socio.apellidos}</p>
            <span className={cn("rounded-full border px-2 py-0.5 text-xs", statusStyle[st.status].cls)}>{statusStyle[st.status].label}</span>
            <p className="pt-2"><b>Código:</b> {socio.codigo_socio} · <b>DNI:</b> {socio.dni}</p>
            <p><b>Teléfono:</b> {socio.telefono} · <b>Correo:</b> {socio.email}</p>
            <p><b>Emergencia:</b> {socio.contacto_emergencia ?? "—"}</p>
            <p><b>Ficha médica:</b> {socio.notas_medicas ?? "Sin padecimientos"} {socio.alergias && `· Alergias: ${socio.alergias}`}</p>
          </div>
        </div>
        <h4 className="mt-4 text-sm">Historial de suscripciones</h4>
        <ul className="divide-y rounded-lg border text-sm">
          {[...socio.suscripciones].sort((a, b) => (a.fecha_fin < b.fecha_fin ? 1 : -1)).slice(0, 6).map((s) => (
            <li key={s.id} className="flex justify-between p-2"><span>{s.planes_membresia?.nombre}</span><span className="text-muted-foreground">{s.fecha_inicio} → {s.fecha_fin}</span><span>{money(s.total_pagado)}</span></li>
          ))}
        </ul>
        <h4 className="mt-4 text-sm">Últimos accesos</h4>
        <ul className="divide-y rounded-lg border text-sm">
          {accesos?.map((a) => (
            <li key={a.id} className="flex justify-between p-2"><span>{new Date(a.fecha_hora).toLocaleString("es")}</span><span className={a.estado === "PERMITIDO" ? "text-success" : "text-destructive"}>{a.estado}</span></li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{l}</Label>{children}</div>;
}
