import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/configuracion")({
  validateSearch: (s: Record<string, unknown>) => ({ socio: typeof s["socio"] === "string" ? (s["socio"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Configuración — IronCore" }] }),
  component: () => (
    <>
      <PageHeader title="Configuración" subtitle="Módulo en construcción" />
      <p className="text-muted-foreground">Este módulo aún no está terminado.</p>
    </>
  ),
});
