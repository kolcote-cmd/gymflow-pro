import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/pos")({
  validateSearch: (s: Record<string, unknown>) => ({ socio: typeof s["socio"] === "string" ? (s["socio"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Tienda POS — IronCore" }] }),
  component: () => (
    <>
      <PageHeader title="Tienda POS" subtitle="Módulo en construcción" />
      <p className="text-muted-foreground">Este módulo aún no está terminado.</p>
    </>
  ),
});
