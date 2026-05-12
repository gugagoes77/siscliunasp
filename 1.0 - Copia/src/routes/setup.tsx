import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { getApiUrl, setApiUrl } from "@/lib/sheets-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
  head: () => ({ meta: [{ title: "Configuração — UNASP" }] }),
});

function SetupPage() {
  const [url, setUrl] = useState(getApiUrl());
  const navigate = useNavigate();

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!url.startsWith("https://script.google.com/")) {
      toast.error("URL inválida. Deve começar com https://script.google.com/");
      return;
    }
    setApiUrl(url);
    toast.success("URL salva");
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/30">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Configuração do Backend</CardTitle>
          <CardDescription>
            Cole a URL do seu Web App do Google Apps Script publicado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL do Apps Script</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfy.../exec"
                required
              />
            </div>
            <div className="text-sm text-muted-foreground space-y-2 bg-muted p-4 rounded-lg">
              <p className="font-semibold text-foreground">Passos:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Crie uma planilha no Google Drive.</li>
                <li>Em <em>Extensões → Apps Script</em>, cole o código de <code>apps-script/Code.gs</code>.</li>
                <li>Clique <em>Implantar → Nova implantação → Tipo: App da Web</em>.</li>
                <li>Em "Quem pode acessar", escolha <em>Qualquer pessoa</em>.</li>
                <li>Copie a URL gerada e cole acima.</li>
              </ol>
            </div>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}