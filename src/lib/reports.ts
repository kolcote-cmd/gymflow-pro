export type ReportCell = string | number | null;
export function csvText(headers: string[], rows: ReportCell[][]) {
  const escape = (v: ReportCell) => { const s=String(v??''); return '"'+(/^[=+@\-\t\r]/.test(s)?"'"+s:s).replaceAll('"','""')+'"'; };
  return '\uFEFF'+[headers,...rows].map(r=>r.map(escape).join(',')).join('\r\n');
}
export function downloadBlob(blob: Blob, name: string) {
 const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export async function exportReport(format: 'PDF'|'XLSX'|'CSV', title: string, headers: string[], rows: ReportCell[][]) {
 const filename='IronCore-'+title.replaceAll(' ','-');
 if(format==='CSV') {downloadBlob(new Blob([csvText(headers,rows)],{type:'text/csv;charset=utf-8'}),filename+'.csv');return;}
 if(format==='PDF') {
  const {jsPDF}=await import('jspdf'); const {default:autoTable}=await import('jspdf-autotable');
  const doc=new jsPDF({orientation:headers.length>5?'landscape':'portrait'});doc.setFontSize(18);doc.text('IRONCORE GYM',14,18);doc.setFontSize(11);doc.text(title+' | '+new Date().toLocaleString('es'),14,26);
  autoTable(doc,{head:[headers],body:rows.map(r=>r.map(v=>v??'')),startY:33,styles:{fontSize:8,overflow:'linebreak'},margin:14});doc.save(filename+'.pdf');return;
 }
 const {default:writeXlsxFile}=await import('write-excel-file');
 await writeXlsxFile([headers.map(value=>({value,fontWeight:'bold' as const})),...rows.map(r=>r.map(value=>({value:value??'',type:typeof value==='number'?Number:String})))],{fileName:filename+'.xlsx',columns:headers.map(()=>({width:24})),fontFamily:'Arial',fontSize:11});
}
