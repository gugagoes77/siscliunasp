import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { getApiUrl, setApiUrl, sha256, apiCall } from "@/lib/sheets-api";
import { usuariosApi } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/config")({
  component: ConfigPage,
  head: () => ({ meta: [{ title: "Configurações — UNASP" }] }),
});

function ConfigPage() {
  const [url, setUrl] = useState(getApiUrl());
  const list = usuariosApi.useList();
  const del = usuariosApi.useDelete();
  const [open, setOpen] = useState(false);
  const [novo, setNovo] = useState({ username: "", nome: "", password: "", role: "user" });

  async function criar() {
    if (!novo.username || !novo.password) { toast.error("Preencha usuário e senha"); return; }
    try {
      const passwordHash = await sha256(novo.password);
      await apiCall("create", { entity: "usuarios", data: { username: novo.username, nome: novo.nome, role: novo.role, passwordHash } });
      toast.success("Usuário criado");
      setOpen(false); setNovo({ username: "", nome: "", password: "", role: "user" });
      list.refetch();
    } catch (e: any) { toast.error(e?.message ?? "Erro"); }
  }

  return (
    <div>
      <PageHeader title="Configurações" description="URL do backend e gestão de usuários" />
      <Card className="p-5 mb-4">
        <h2 className="font-semibold mb-3">URL do Apps Script</h2>
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" />
          <Button onClick={() => { setApiUrl(url); toast.success("URL salva"); }}>Salvar</Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Usuários do sistema</h2>
          <Button onClick={() => setOpen(true)}>Novo usuário</Button>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Nome</TableHead><TableHead>Papel</TableHead><TableHead className="w-20 text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {(list.data ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono">{u.username}</TableCell>
                  <TableCell>{u.nome}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={async () => { if (confirm("Excluir?")) { await del.mutateAsync(u.id); toast.success("Excluído"); } }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Usuário</Label><Input value={novo.username} onChange={(e) => setNovo({ ...novo, username: e.target.value })} /></div>
            <div><Label>Nome</Label><Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></div>
            <div><Label>Senha</Label><Input type="password" value={novo.password} onChange={(e) => setNovo({ ...novo, password: e.target.value })} /></div>
            <div><Label>Papel</Label>
              <select className="w-full border rounded-md h-9 px-2 bg-background" value={novo.role} onChange={(e) => setNovo({ ...novo, role: e.target.value })}>
                <option value="user">user</option><option value="admin">admin</option>
              </select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={criar}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}