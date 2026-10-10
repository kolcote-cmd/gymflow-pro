import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dumbbell, ScanLine, ShoppingCart, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IronCore — Sistema de Gestión para Gimnasios" },
      { name: "description", content: "Control de acceso, socios, membresías, tienda POS y rutinas en una sola plataforma." },
      { property: "og:title", content: "IronCore — Sistema de Gestión para Gimnasios" },
      { property: "og:description", content: "Control de acceso, socios, membresías, tienda POS y rutinas en una sola plataforma." },
    ],
  }),
  component: Index,
});

function Index() {
  const items = [
    { i: ScanLine, t: "Torniquete & Check-in" },
    { i: Users, t: "Gestión de socios" },
    { i: ShoppingCart, t: "Tienda POS" },
    { i: Dumbbell, t: "Rutinas & evaluaciones" },
  ];
  return (
    <main className="relative min-h-screen overflow-hidden grid-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background to-background" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="mb-6 h-2 w-24 stripe-accent" />
        <h1 className="text-5xl font-bold leading-none md:text-8xl">
          Iron<span className="text-primary">Core</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          ERP y punto de venta para gimnasios. Accesos, cobros, inventario y entrenamiento en tiempo real.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/auth">Entrar al sistema</Link></Button>
        </div>
        <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map(({ i: Icon, t }) => (
            <div key={t} className="rounded-lg border bg-card/80 p-4">
              <Icon className="mb-3 size-6 text-primary" />
              <p className="font-display text-sm">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
