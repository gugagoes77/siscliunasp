import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CalendarPlus,
  CalendarDays,
  Package,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const items: Item[] = [
  { to: "/", label: "Página Principal", icon: LayoutDashboard, exact: true },
  { to: "/cadastros/pacientes", label: "Pacientes", icon: Users },
  { to: "/cadastros/alunos", label: "Alunos / Duplas", icon: GraduationCap },
  { to: "/cadastros/orientadores", label: "Orientadores", icon: UserCheck },
  { to: "/agendamento", label: "Agendamento", icon: CalendarPlus },
  { to: "/calendario", label: "Calendário Geral", icon: CalendarDays },
  { to: "/materiais", label: "Reserva de Materiais", icon: Package },
  { to: "/mensagens", label: "Envio de Mensagens", icon: MessageSquare },
  { to: "/config", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground grid place-items-center font-bold">
            U
          </div>
          <div>
            <p className="font-semibold leading-tight">UNASP</p>
            <p className="text-xs opacity-80 leading-tight">Clínica-Escola</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm"
                  : "hover:bg-sidebar-accent/60",
              )}
            >
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-2 text-xs opacity-90">
          <p className="font-medium truncate">{user?.nome ?? user?.username}</p>
          <p className="opacity-70 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-sidebar-accent/60"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );
}