import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso — IronCore" },
      { name: "description", content: "Inicia sesión o regístrate en IronCore Gym Management System." },
      { property: "og:title", content: "Acceso — IronCore" },
      { property: "og:description", content: "Inicia sesión o regístrate en IronCore." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    nav({ to: "/dashboard" });
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) nav({ to: "/dashboard" });
    else toast.success("Revisa tu correo para confirmar la cuenta.");
  }

  return (
    <main className="grid min-h-screen place-items-center grid-bg px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground"><Zap /></div>
          <div>
            <h1 className="text-2xl font-bold">Iron<span className="text-primary">Core</span></h1>
            <p className="text-xs text-muted-foreground">Gym Management System</p>
          </div>
        </div>
        <Tabs defaultValue="in">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="in">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="up">Registrarse</TabsTrigger>
          </TabsList>
          <TabsContent value="in">
            <form onSubmit={signIn} className="space-y-4">
              <Field label="Correo"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Contraseña"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
              <Button className="w-full" disabled={loading}>Entrar</Button>
            </form>
          </TabsContent>
          <TabsContent value="up">
            <form onSubmit={signUp} className="space-y-4">
              <Field label="Nombre completo"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Correo"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Contraseña"><Input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
              <p className="text-xs text-muted-foreground">
                La primera cuenta registrada obtiene rol ADMIN. Las siguientes inician como SOCIO y el administrador asigna su rol.
              </p>
              <Button className="w-full" disabled={loading}>Crear cuenta</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
