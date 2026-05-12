import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { alunosApi } from "@/lib/hooks";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/cadastros/alunos")({
  component: AlunosPage,
  head: () => ({ meta: [{ title: "Alunos — UNASP" }] }),
});

const schema = z.object({
  nomeCompleto: z.string().trim().min(2, "Obrigatório").max(120),
  telefone: z.string().trim().min(8).max(20),
  semestre: z.string().trim().min(1, "Obrigatório").max(20),
});
type FormData = z.infer<typeof schema>;

function AlunosPage() {
  const list = alunosApi.useList();
  const create = alunosApi.useCreate();
  const update = alunosApi.useUpdate();
  const del = alunosApi.useDelete();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState<Aluno | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    const data = list.data ?? [];
    if (!s) return data;
    return data.filter((a) => `${a.nomeCompleto} ${a.telefone} ${a.semestre}`.toLowerCase().includes(s));
  }, [list.data, search]);

  return (
    <div>
      <PageHeader
        title="Alunos / Duplas"
        description="Cadastro dos alunos e duplas atendentes"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo aluno
          </Button>
        }
      />
      <Card className="p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome completo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!list.isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum cadastro</TableCell></TableRow>}
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nomeCompleto}</TableCell>
                  <TableCell>{a.telefone}</TableCell>
                  <TableCell>{a.semestre}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDel(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlunoForm open={open} onOpenChange={setOpen} editing={editing} onSubmit={async (data) => {
        try {
          if (editing) { await update.mutateAsync({ ...editing, ...data }); toast.success("Atualizado"); }
          else { await create.mutateAsync(data); toast.success("Cadastrado"); }
          setOpen(false);
        } catch (e: any) { toast.error(e?.message ?? "Erro"); }
      }} />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno?</AlertDialogTitle>
            <AlertDialogDescription>{confirmDel?.nomeCompleto}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!confirmDel) return; try { await del.mutateAsync(confirmDel.id); toast.success("Excluído"); setConfirmDel(null); } catch (e: any) { toast.error(e?.message ?? "Erro"); } }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AlunoForm({ open, onOpenChange, editing, onSubmit }: { open: boolean; onOpenChange: (o: boolean) => void; editing: Aluno | null; onSubmit: (d: FormData) => Promise<void> }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: editing ?? { nomeCompleto: "", telefone: "", semestre: "" },
    values: editing ?? undefined,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Editar aluno" : "Novo aluno"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome completo *</Label>
            <Input {...form.register("nomeCompleto")} />
            {form.formState.errors.nomeCompleto && <p className="text-xs text-destructive mt-1">{form.formState.errors.nomeCompleto.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone *</Label>
              <Input {...form.register("telefone")} />
              {form.formState.errors.telefone && <p className="text-xs text-destructive mt-1">{form.formState.errors.telefone.message}</p>}
            </div>
            <div>
              <Label>Semestre em curso *</Label>
              <Input {...form.register("semestre")} placeholder="Ex.: 7º" />
              {form.formState.errors.semestre && <p className="text-xs text-destructive mt-1">{form.formState.errors.semestre.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}