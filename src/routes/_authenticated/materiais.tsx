import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { alunosApi, materiaisApi } from "@/lib/hooks";
import type { Material } from "@/lib/types";
import { SALAS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/materiais")({
  component: MateriaisPage,
  head: () => ({ meta: [{ title: "Materiais — UNASP" }] }),
});

type FormState = { id?: string; alunoId: string; sala: string; data: string; hora: string; material: string };
const empty: FormState = { alunoId: "", sala: "", data: "", hora: "", material: "" };

function MateriaisPage() {
  const list = materiaisApi.useList();
  const alunos = alunosApi.useList();
  const create = materiaisApi.useCreate();
  const update = materiaisApi.useUpdate();
  const del = materiaisApi.useDelete();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [confirmDel, setConfirmDel] = useState<Material | null>(null);
  const [search, setSearch] = useState("");

  const alunoMap = useMemo(() => new Map((alunos.data ?? []).map((a) => [a.id, a])), [alunos.data]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    let data = list.data ?? [];
    if (s) data = data.filter((m) =>
      `${m.material} ${m.sala} ${alunoMap.get(m.alunoId)?.nomeCompleto ?? ""}`.toLowerCase().includes(s),
    );
    return [...data].sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
  }, [list.data, search, alunoMap]);

  function openNew() { setForm(empty); setOpen(true); }
  function openEdit(m: Material) { setForm({ ...m }); setOpen(true); }

  async function save() {
    if (!form.alunoId || !form.sala || !form.data || !form.hora || !form.material.trim()) {
      toast.error("Preencha todos os campos"); return;
    }
    try {
      if (form.id) { await update.mutateAsync(form as Material); toast.success("Atualizado"); }
      else { await create.mutateAsync(form); toast.success("Reservado"); }
      setOpen(false);
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  }

  return (
    <div>
      <PageHeader title="Reserva de Materiais"
        description="Registro de materiais utilizados nas sessões"
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Nova reserva</Button>} />
      <Card className="p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead>Aluno</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!list.isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma reserva</TableCell></TableRow>}
              {filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.data ? format(parseISO(m.data), "dd/MM/yyyy") : "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{m.hora}</TableCell>
                  <TableCell>{m.sala}</TableCell>
                  <TableCell>{alunoMap.get(m.alunoId)?.nomeCompleto ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{m.material}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDel(m)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Editar reserva" : "Nova reserva"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aluno / Dupla *</Label>
              <Select value={form.alunoId} onValueChange={(v) => setForm({ ...form, alunoId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(alunos.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nomeCompleto}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Sala *</Label>
                <Select value={form.sala} onValueChange={(v) => setForm({ ...form, sala: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SALAS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
              <div>
                <Label>Horário *</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Material utilizado *</Label>
              <Textarea value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir reserva?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!confirmDel) return; try { await del.mutateAsync(confirmDel.id); toast.success("Excluída"); setConfirmDel(null); } catch (e: any) { toast.error(e?.message ?? "Erro"); } }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}