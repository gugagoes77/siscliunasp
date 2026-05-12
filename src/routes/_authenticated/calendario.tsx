import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, parseISO, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { alunosApi, pacientesApi, sessoesApi } from "@/lib/hooks";
import { SALAS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendario")({
  component: CalendarioPage,
  head: () => ({ meta: [{ title: "Calendário — UNASP" }] }),
});

function CalendarioPage() {
  const sessoes = sessoesApi.useList();
  const alunos = alunosApi.useList();
  const pacientes = pacientesApi.useList();

  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [filterSala, setFilterSala] = useState("all");
  const [filterAluno, setFilterAluno] = useState("all");
  const [filterPaciente, setFilterPaciente] = useState("all");

  const alunoMap = useMemo(() => new Map((alunos.data ?? []).map((a) => [a.id, a])), [alunos.data]);
  const pacienteMap = useMemo(() => new Map((pacientes.data ?? []).map((p) => [p.id, p])), [pacientes.data]);

  const filtered = useMemo(() => {
    let list = (sessoes.data ?? []).filter((s) => s.status !== "cancelada");
    if (filterSala !== "all") list = list.filter((s) => s.sala === filterSala);
    if (filterAluno !== "all") list = list.filter((s) => s.alunoId === filterAluno);
    if (filterPaciente !== "all") list = list.filter((s) => s.pacienteId === filterPaciente);
    return list;
  }, [sessoes.data, filterSala, filterAluno, filterPaciente]);

  const byDay = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const s of filtered) {
      const arr = m.get(s.data) ?? [];
      arr.push(s);
      m.set(s.data, arr);
    }
    // detectar conflitos: mesma data+horaInicio+sala (>1) ou mesma data+horaInicio+aluno (>1)
    return m;
  }, [filtered]);

  function hasConflict(day: string) {
    const arr = byDay.get(day) ?? [];
    const seenSala = new Set<string>();
    const seenAluno = new Set<string>();
    for (const s of arr) {
      const k1 = `${s.sala}|${s.horaInicio}`;
      const k2 = `${s.alunoId}|${s.horaInicio}`;
      if (seenSala.has(k1) || seenAluno.has(k2)) return true;
      seenSala.add(k1); seenAluno.add(k2);
    }
    return false;
  }

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const selectedSessions = selected ? (byDay.get(selected) ?? []).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)) : [];

  return (
    <div>
      <PageHeader title="Calendário Geral" description="Visualização mensal das sessões" />

      <Card className="p-4 mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Sala</Label>
            <Select value={filterSala} onValueChange={setFilterSala}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {SALAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Aluno</Label>
            <Select value={filterAluno} onValueChange={setFilterAluno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(alunos.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nomeCompleto}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Paciente</Label>
            <Select value={filterPaciente} onValueChange={setFilterPaciente}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(pacientes.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.primeiroNome} {p.sobrenome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-semibold capitalize">{format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}</h2>
          <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs font-medium text-muted-foreground mb-1">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="text-center py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const arr = byDay.get(key) ?? [];
            const conflict = hasConflict(key);
            const inMonth = isSameMonth(day, cursor);
            const today = isToday(day);
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  "min-h-[88px] p-2 rounded-lg border text-left transition-colors",
                  inMonth ? "bg-card" : "bg-muted/40 text-muted-foreground",
                  today && "ring-2 ring-primary",
                  conflict && "border-destructive/50 bg-destructive/5",
                  "hover:bg-accent/40",
                )}
              >
                <div className="text-sm font-medium">{format(day, "d")}</div>
                {arr.length > 0 && (
                  <div className={cn(
                    "mt-1 inline-flex px-1.5 py-0.5 rounded text-xs",
                    conflict ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground",
                  )}>
                    {arr.length} {arr.length === 1 ? "sessão" : "sessões"}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-primary inline-block" /> Agendada</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-destructive inline-block" /> Conflito</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border bg-card inline-block" /> Livre</span>
        </div>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selected && format(parseISO(selected), "dd 'de' MMMM yyyy", { locale: ptBR })}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {selectedSessions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma sessão neste dia.</p>}
            {selectedSessions.map((s) => {
              const a = alunoMap.get(s.alunoId); const p = pacienteMap.get(s.pacienteId);
              return (
                <div key={s.id} className="rounded-lg border p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-mono">{s.horaInicio}–{s.horaFim}</span>
                    <span className="text-muted-foreground">Sala {s.sala}</span>
                  </div>
                  <p className="mt-1 text-sm"><span className="text-muted-foreground">Aluno:</span> {a?.nomeCompleto ?? "—"}</p>
                  <p className="text-sm"><span className="text-muted-foreground">Paciente:</span> {p ? `${p.primeiroNome} ${p.sobrenome}` : "—"}</p>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}