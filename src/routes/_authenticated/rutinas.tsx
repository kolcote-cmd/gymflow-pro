import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/rutinas")({
  validateSearch: (s: Record<string, unknown>) => ({ socio: typeof s["socio"] === "string" ? (s["socio"] as string) : undefined }),
  head: () => ({ meta: [{ title: "Rutinas — IronCore" }] }),
  component: () => (
    <>
      <PageHeader title="Rutinas" subtitle="Módulo en construcción" />
      <p className="text-muted-foreground">Este módulo aún no está terminado.</p>
    </>
  ),
});
