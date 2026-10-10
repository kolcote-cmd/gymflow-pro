import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { money } from "@/lib/gym";

export type ReceiptData = {
  folio: string;
  cliente?: string;
  lineas: { desc: string; qty: number; total: number }[];
  subtotal: number;
  descuento?: number;
  impuesto?: number;
  total: number;
  metodo: string;
  recibido?: number;
  cambio?: number;
};

export function Receipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Comprobante</DialogTitle></DialogHeader>
        <div className="print-area rounded-md bg-foreground p-5 font-mono text-xs text-background">
          <p className="text-center text-base font-bold">IRONCORE GYM</p>
          <p className="text-center">Comprobante de pago</p>
          <p className="mt-2">Folio: {data.folio}</p>
          <p>Fecha: {new Date().toLocaleString("es")}</p>
          {data.cliente && <p>Cliente: {data.cliente}</p>}
          <div className="my-2 border-t border-dashed border-background" />
          {data.lineas.map((l, i) => (
            <div key={i} className="flex justify-between"><span>{l.qty}x {l.desc}</span><span>{money(l.total)}</span></div>
          ))}
          <div className="my-2 border-t border-dashed border-background" />
          <Row k="Subtotal" v={data.subtotal} />
          {!!data.descuento && <Row k="Descuento" v={-data.descuento} />}
          {data.impuesto !== undefined && <Row k="Impuesto" v={data.impuesto} />}
          <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span>{money(data.total)}</span></div>
          <p className="mt-1">Pago: {data.metodo}</p>
          {data.recibido !== undefined && <><Row k="Recibido" v={data.recibido} /><Row k="Cambio" v={data.cambio ?? 0} /></>}
          <p className="mt-3 text-center">¡Gracias por entrenar con nosotros!</p>
        </div>
        <Button onClick={() => window.print()}><Printer /> Imprimir / Exportar PDF</Button>
      </DialogContent>
    </Dialog>
  );
}
function Row({ k, v }: { k: string; v: number }) {
  return <div className="flex justify-between"><span>{k}</span><span>{money(v)}</span></div>;
}
