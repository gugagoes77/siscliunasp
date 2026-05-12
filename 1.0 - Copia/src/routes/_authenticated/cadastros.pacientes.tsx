import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { pacientesApi } from "@/lib/hooks";
import type { Paciente } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/cadastros/pacientes")({
  component: PacientesPage,
  head: () => ({ meta: [{ title: "Pacientes — UNASP" }] }),
});

const schema = z
  .object({
    primeiroNome: z.string().trim().min(1, "Obrigatório").max(60),
    sobrenome: z.string().trim().min(1, "Obrigatório").max(80),
    telefone: z.string().trim().min(8, "Telefone inválido").max(20),
    email: z.string().trim().email("E-mail inválido").or(z.literal("")),
    menorIdade: z.boolean(),
  respPrimeiroNome: z.string().trim().max(60).default(""),
  respSobrenome: z.string().trim().max(80).default(""),
  })
  .refine((d) => !d.menorIdade || (d.respPrimeiroNome && d.respSobrenome), {
    message: "Informe o responsável",
    path: ["respPrimeiroNome"],
  });

type FormData = z.infer<typeof schema>;

function PacientesPage() {
  const list = pacientesApi.useList();
  const create = pacientesApi.useCreate();
  const update = pacientesApi.useUpdate();
  const del = pacientesApi.useDelete();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Paciente | null>(null);
  const [search, setSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState<Paciente | null>(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return list.data ?? [];
    return (list.data ?? []).filter((p) =>
      `${p.primeiroNome} ${p.sobrenome} ${p.telefone} ${p.email}`.toLowerCase().includes(s),
    );
  }, [list.data, search]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: Paciente) {
    setEditing(p);
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Cadastro de pacientes da clínica-escola"
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo paciente
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!list.isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum paciente cadastrado</TableCell></TableRow>
              )}
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.primeiroNome} {p.sobrenome}
                    {p.menorIdade && <Badge variant="secondary" className="ml-2">Menor</Badge>}
                  </TableCell>
                  <TableCell>{p.telefone}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>
                    {p.menorIdade ? `${p.respPrimeiroNome} ${p.respSobrenome}` : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDel(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <PacienteForm
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        onSubmit={async (data) => {
          try {
            if (editing) {
              await update.mutateAsync({ ...editing, ...data });
              toast.success("Paciente atualizado");
            } else {
              await create.mutateAsync(data);
              toast.success("Paciente cadastrado");
            }
            setOpen(false);
          } catch (e: any) {
            toast.error(e?.message ?? "Erro ao salvar");
          }
        }}
      />

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir paciente?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDel && `${confirmDel.primeiroNome} ${confirmDel.sobrenome}`} será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDel) return;
                try {
                  await del.mutateAsync(confirmDel.id);
                  toast.success("Excluído");
                  setConfirmDel(null);
                } catch (e: any) {
                  toast.error(e?.message ?? "Erro ao excluir");
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PacienteForm({
  open, onOpenChange, editing, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Paciente | null;
  onSubmit: (d: FormData) => Promise<void>;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: editing ?? {
      primeiroNome: "", sobrenome: "", telefone: "", email: "",
      menorIdade: false, respPrimeiroNome: "", respSobrenome: "",
    },
    values: editing ?? undefined,
  });
  const menor = form.watch("menorIdade");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar paciente" : "Novo paciente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Primeiro nome *</Label>
              <Input {...form.register("primeiroNome")} />
              {form.formState.errors.primeiroNome && <p className="text-xs text-destructive mt-1">{form.formState.errors.primeiroNome.message}</p>}
            </div>
            <div>
              <Label>Sobrenome *</Label>
              <Input {...form.register("sobrenome")} />
              {form.formState.errors.sobrenome && <p className="text-xs text-destructive mt-1">{form.formState.errors.sobrenome.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone *</Label>
              <Input {...form.register("telefone")} />
              {form.formState.errors.telefone && <p className="text-xs text-destructive mt-1">{form.formState.errors.telefone.message}</p>}
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="menor"
              checked={menor}
              onCheckedChange={(v) => form.setValue("menorIdade", !!v)}
            />
            <Label htmlFor="menor" className="cursor-pointer">Paciente menor de 18 anos</Label>
          </div>
          {menor && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg border">
              <div>
                <Label>Primeiro nome do responsável *</Label>
                <Input {...form.register("respPrimeiroNome")} />
                {form.formState.errors.respPrimeiroNome && <p className="text-xs text-destructive mt-1">{form.formState.errors.respPrimeiroNome.message}</p>}
              </div>
              <div>
                <Label>Sobrenome do responsável *</Label>
                <Input {...form.register("respSobrenome")} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}