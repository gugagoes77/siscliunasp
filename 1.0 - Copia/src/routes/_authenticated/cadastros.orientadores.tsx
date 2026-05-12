import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { orientadoresApi } from "@/lib/hooks";
import type { Orientador } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/cadastros/orientadores")({
  component: OrientadoresPage,
  head: () => ({ meta: [{ title: "Orientadores — UNASP" }] }),
});

const schema = z.object({ nome: z.string().trim().min(2).max(120) });
type FormData = z.infer<typeof schema>;

function OrientadoresPage() {
  const list = orientadoresApi.useList();
  const create = orientadoresApi.useCreate();
  const update = orientadoresApi.useUpdate();
  const del = orientadoresApi.useDelete();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Orientador | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState<Orientador | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    const data = list.data ?? [];
    return s ? data.filter((o) => o.nome.toLowerCase().includes(s)) : data;
  }, [list.data, search]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { nome: "" },
    values: editing ?? undefined,
  });

  return (
    <div>
      <PageHeader title="Orientadores" description="Cadastro dos orientadores"
        action={<Button onClick={() => { setEditing(null); form.reset({ nome: "" }); setOpen(true); }}><Plus className="h-4 w-4" /> Novo</Button>} />
      <Card className="p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="w-32 text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.isLoading && <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>}
              {!list.isLoading && filtered.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum cadastro</TableCell></TableRow>}
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.nome}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(o); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDel(o)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar orientador" : "Novo orientador"}</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(async (data) => {
            try {
              if (editing) { await update.mutateAsync({ ...editing, ...data }); toast.success("Atualizado"); }
              else { await create.mutateAsync(data); toast.success("Cadastrado"); }
              setOpen(false);
            } catch (e: any) { toast.error(e?.message ?? "Erro"); }
          })} className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input {...form.register("nome")} />
              {form.formState.errors.nome && <p className="text-xs text-destructive mt-1">{form.formState.errors.nome.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir orientador?</AlertDialogTitle><AlertDialogDescription>{confirmDel?.nome}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!confirmDel) return; try { await del.mutateAsync(confirmDel.id); toast.success("Excluído"); setConfirmDel(null); } catch (e: any) { toast.error(e?.message ?? "Erro"); } }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}