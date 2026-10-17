import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportReport, type ReportCell } from '@/lib/reports';
import { toast } from 'sonner';
import { useState } from 'react';
export function ReportButtons({title,headers,rows}:{title:string;headers:string[];rows:ReportCell[][]}) {
 const [busy,setBusy]=useState(false);
 return <div className="flex flex-wrap gap-2">{(['PDF','XLSX','CSV'] as const).map(format=><Button key={format} size="sm" variant="outline" disabled={busy||!rows.length} onClick={async()=>{setBusy(true);try{await exportReport(format,title,headers,rows);}catch(e){toast.error(e instanceof Error?e.message:'No se pudo exportar');}finally{setBusy(false);}}}><Download className="size-4"/>{format}</Button>)}</div>;
}
