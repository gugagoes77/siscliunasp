import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { addDays, format, isToday, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Users, AlertTriangle } from "lucide-react";
import { alunosApi, pacientesApi, sessoesApi } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
  head: () => ({ meta: [{ title: "Início — Clínica-Escola UNASP" }] }),
});

function HomePage() {
  const sessoes = sessoesApi.useList();
  const alunos = alunosApi.useList();
  const pacientes = pacientesApi.useList();

  const alunoMap = useMemo(() => new Map((alunos.data ?? []).map((a) => [a.id, a])), [alunos.data]);
  const pacienteMap = useMemo(() => new Map((pacientes.data ?? []).map((p) => [p.id, p])), [pacientes.data]);

  const ativas = useMemo(() => (sessoes.data ?? []).filter((s) => s.status !== "cancelada"), [sessoes.data]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const today = useMemo(
    () => ativas.filter((s) => s.data === todayStr).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [ativas, todayStr],
  );

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekByDay = useMemo(() => {
    const m = new Map<string, typeof ativas>();
    for (const d of weekDays) {
      const k = format(d, "yyyy-MM-dd");
      m.set(k, ativas.filter((s) => s.data === k).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)));
    }
    return m;
  }, [ativas, weekDays]);

  const conflitos = useMemo(() => {
    let count = 0;
    const seenSala = new Set<string>(); const seenAluno = new Set<string>();
    for (const s of ativas) {
      const k1 = `${s.data}|${s.sala}|${s.horaInicio}`;
      const k2 = `${s.data}|${s.alunoId}|${s.horaInicio}`;
      if (seenSala.has(k1) || seenAluno.has(k2)) count++;
      seenSala.add(k1); seenAluno.add(k2);
    }
    return count;
  }, [ativas]);

  return (
    <div>
      <PageHeader
        title={`Olá! ${format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}`}
        description="Visão geral da clínica-escola"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard icon={<Calendar className="h-5 w-5" />} label="Sessões hoje" value={today.length} accent="primary" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Pacientes ativos" value={(pacientes.data ?? []).length} accent="primary" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Conflitos detectados" value={conflitos} accent={conflitos > 0 ? "destructive" : "primary"} />
      </div>

      <Card className="p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3">Cronograma do dia</h2>
        {today.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão para hoje.</p>
        ) : (
          <div className="rounded-lg border divide-y">
            {today.map((s) => {
              const a = alunoMap.get(s.alunoId); const p = pacienteMap.get(s.pacienteId);
              return (
                <div key={s.id} className="flex items-center gap-3 p-3">
                  <div className="font-mono text-sm bg-primary/10 text-primary rounded-md px-2 py-1">{s.horaInicio}</div>
                  <Badge variant="secondary">Sala {s.sala}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p ? `${p.primeiroNome} ${p.sobrenome}` : "—"}</p>
                    <p className="text-xs text-muted-foreground">Aluno: {a?.nomeCompleto ?? "—"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Cronograma da semana</h2>
          <Link to="/calendario" className="text-sm text-primary hover:underline">Ver calendário</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {weekDays.map((d) => {
            const k = format(d, "yyyy-MM-dd");
            const arr = weekByDay.get(k) ?? [];
            return (
              <div key={k} className={`rounded-lg border p-3 ${isToday(d) ? "border-primary/50 bg-primary/5" : ""}`}>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-semibold capitalize">{format(d, "EEEE", { locale: ptBR })}</h3>
                  <span className="text-xs text-muted-foreground">{format(d, "dd/MM")}</span>
                </div>
                {arr.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem sessões</p>
                ) : (
                  <ul className="space-y-1.5">
                    {arr.slice(0, 5).map((s) => {
                      const a = alunoMap.get(s.alunoId); const p = pacienteMap.get(s.pacienteId);
                      return (
                        <li key={s.id} className="text-xs flex gap-2">
                          <span className="font-mono text-primary">{s.horaInicio}</span>
                          <span className="text-muted-foreground">S{s.sala}</span>
                          <span className="truncate">{p ? `${p.primeiroNome}` : "—"} / {a?.nomeCompleto.split(" ")[0] ?? "—"}</span>
                        </li>
                      );
                    })}
                    {arr.length > 5 && <li className="text-xs text-muted-foreground">+{arr.length - 5} mais</li>}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: "primary" | "destructive" }) {
  const accentClass = accent === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl grid place-items-center ${accentClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}