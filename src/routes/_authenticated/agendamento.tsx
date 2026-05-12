import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { alunosApi, pacientesApi, sessoesApi } from "@/lib/hooks";
import { SALAS, horariosParaData, diaSemanaLabel } from "@/lib/constants";
import type { Sessao } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/agendamento")({
  component: AgendamentoPage,
  head: () => ({ meta: [{ title: "Agendamento — UNASP" }] }),
});

type FormState = {
  id?: string;
  sala: string;
  alunoId: string;
  pacienteId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
};

const empty: FormState = { sala: "", alunoId: "", pacienteId: "", data: "", horaInicio: "", horaFim: "" };

function AgendamentoPage() {
  const sessoes = sessoesApi.useList();
  const alunos = alunosApi.useList();
  const pacientes = pacientesApi.useList();
  const create = sessoesApi.useCreate();
  const update = sessoesApi.useUpdate();
  const del = sessoesApi.useDelete();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [confirmDel, setConfirmDel] = useState<Sessao | null>(null);

  const [filterSala, setFilterSala] = useState<string>("all");
  const [filterAluno, setFilterAluno] = useState<string>("all");
  const [filterData, setFilterData] = useState<string>("");

  const alunoMap = useMemo(() => new Map((alunos.data ?? []).map((a) => [a.id, a])), [alunos.data]);
  const pacienteMap = useMemo(() => new Map((pacientes.data ?? []).map((p) => [p.id, p])), [pacientes.data]);

  const filtered = useMemo(() => {
    let list = (sessoes.data ?? []).filter((s) => s.status !== "cancelada");
    if (filterSala !== "all") list = list.filter((s) => s.sala === filterSala);
    if (filterAluno !== "all") list = list.filter((s) => s.alunoId === filterAluno);
    if (filterData) list = list.filter((s) => s.data === filterData);
    return list.sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));
  }, [sessoes.data, filterSala, filterAluno, filterData]);

  const dataObj = form.data ? parseISO(form.data) : null;
  const horarios = dataObj ? horariosParaData(dataObj) : [];
  const diaSemana = dataObj ? diaSemanaLabel(dataObj) : "";

  // detectar conflitos para o slot escolhido
  const conflitos = useMemo(() => {
    if (!form.data || !form.horaInicio) return { sala: false, aluno: false };
    const list = (sessoes.data ?? []).filter(
      (s) =>
        s.status !== "cancelada" &&
        s.id !== form.id &&
        s.data === form.data &&
        s.horaInicio === form.horaInicio,
    );
    return {
      sala: !!form.sala && list.some((s) => s.sala === form.sala),
      aluno: !!form.alunoId && list.some((s) => s.alunoId === form.alunoId),
    };
  }, [sessoes.data, form]);

  function openNew() {
    setForm(empty);
    setOpen(true);
  }
  function openEdit(s: Sessao) {
    setForm({
      id: s.id, sala: s.sala, alunoId: s.alunoId, pacienteId: s.pacienteId,
      data: s.data, horaInicio: s.horaInicio, horaFim: s.horaFim,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.sala || !form.alunoId || !form.pacienteId || !form.data || !form.horaInicio) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (conflitos.sala) { toast.error("Conflito: sala já ocupada nesse horário"); return; }
    if (conflitos.aluno) { toast.error("Conflito: aluno já tem sessão nesse horário"); return; }
    const payload = {
      sala: form.sala, alunoId: form.alunoId, pacienteId: form.pacienteId,
      data: form.data, diaSemana, horaInicio: form.horaInicio, horaFim: form.horaFim,
      status: "agendada" as const,
    };
    try {
      if (form.id) {
        await update.mutateAsync({ ...payload, id: form.id });
        toast.success("Sessão atualizada");
      } else {
        await create.mutateAsync(payload);
        toast.success("Sessão agendada");
      }
      setOpen(false);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  }

  function isSlotOcupado(horaInicio: string) {
    if (!form.data || !form.sala) return false;
    return (sessoes.data ?? []).some(
      (s) => s.status !== "cancelada" && s.id !== form.id &&
        s.data === form.data && s.sala === form.sala && s.horaInicio === horaInicio,
    );
  }

  return (
    <div>
      <PageHeader title="Agendamento de Sessões" description="Gerencie as sessões da clínica"
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova sessão</Button>} />

      <Card className="p-4 mb-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Filtrar por sala</Label>
            <Select value={filterSala} onValueChange={setFilterSala}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {SALAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Filtrar por aluno</Label>
            <Select value={filterAluno} onValueChange={setFilterAluno}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(alunos.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nomeCompleto}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => { setFilterSala("all"); setFilterAluno("all"); setFilterData(""); }} className="w-full">Limpar filtros</Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessoes.isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!sessoes.isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma sessão</TableCell></TableRow>}
              {filtered.map((s) => {
                const aluno = alunoMap.get(s.alunoId);
                const pac = pacienteMap.get(s.pacienteId);
                return (
                  <TableRow key={s.id}>
                    <TableCell>{format(parseISO(s.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell><Badge variant="secondary">{s.diaSemana}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{s.horaInicio}–{s.horaFim}</TableCell>
                    <TableCell>{s.sala}</TableCell>
                    <TableCell>{aluno?.nomeCompleto ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{pac ? `${pac.primeiroNome} ${pac.sobrenome}` : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDel(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{form.id ? "Editar sessão" : "Nova sessão"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Sala *</Label>
                <Select value={form.sala} onValueChange={(v) => setForm({ ...form, sala: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {SALAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value, horaInicio: "", horaFim: "" })} />
                {dataObj && <p className="text-xs text-muted-foreground mt-1">{diaSemana}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Aluno *</Label>
                <Select value={form.alunoId} onValueChange={(v) => setForm({ ...form, alunoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(alunos.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nomeCompleto}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Paciente *</Label>
                <Select value={form.pacienteId} onValueChange={(v) => setForm({ ...form, pacienteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(pacientes.data ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.primeiroNome} {p.sobrenome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Horário *</Label>
              {!form.data && <p className="text-sm text-muted-foreground mt-2">Selecione uma data primeiro.</p>}
              {form.data && horarios.length === 0 && (
                <p className="text-sm text-destructive mt-2">Não há atendimentos nesse dia da semana.</p>
              )}
              {form.data && horarios.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                  {horarios.map((h) => {
                    const ocupado = isSlotOcupado(h.inicio);
                    const selected = form.horaInicio === h.inicio;
                    return (
                      <button
                        key={h.inicio}
                        type="button"
                        disabled={ocupado && !selected}
                        onClick={() => setForm({ ...form, horaInicio: h.inicio, horaFim: h.fim })}
                        className={
                          "p-2 rounded-lg border text-sm transition-colors " +
                          (selected ? "bg-primary text-primary-foreground border-primary " :
                           ocupado ? "bg-muted text-muted-foreground line-through cursor-not-allowed " :
                           "hover:bg-accent ")
                        }
                      >
                        {h.inicio}
                        <div className="text-[10px] opacity-70">{h.fim}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {(conflitos.sala || conflitos.aluno) && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm flex gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  {conflitos.sala && <p>Conflito: a sala já está ocupada nesse horário.</p>}
                  {conflitos.aluno && <p>Conflito: o aluno já tem sessão nesse horário.</p>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={create.isPending || update.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDel && `${format(parseISO(confirmDel.data), "dd/MM/yyyy", { locale: ptBR })} às ${confirmDel.horaInicio} – Sala ${confirmDel.sala}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!confirmDel) return; try { await del.mutateAsync(confirmDel.id); toast.success("Cancelada"); setConfirmDel(null); } catch (e: any) { toast.error(e?.message ?? "Erro"); } }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}