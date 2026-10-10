import { redirect } from "@tanstack/react-router";
import type { Role } from "./gym";

export function homeFor(role: Role) {
  if (role === "SOCIO") return "/portal" as const;
  if (role === "ENTRENADOR") return "/rutinas" as const;
  return "/dashboard" as const;
}

export function allow(roles: Role[]) {
  return ({ context }: { context: { role: Role } }) => {
    if (!roles.includes(context.role)) throw redirect({ to: homeFor(context.role) });
  };
}
