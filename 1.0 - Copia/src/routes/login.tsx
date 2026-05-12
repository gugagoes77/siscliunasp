import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/sheets-api";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Login — Clínica-Escola UNASP" }] }),
});

function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const apiConfigured = !!getApiUrl();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      toast.success("Bem-vindo!");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Falha no login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center text-xl font-bold">
            U
          </div>
          <CardTitle className="text-2xl">Clínica-Escola UNASP</CardTitle>
          <CardDescription>Sistema de Agendamento</CardDescription>
        </CardHeader>
        <CardContent>
          {!apiConfigured && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm">
              <p className="font-semibold text-destructive">Backend não configurado</p>
              <p className="text-muted-foreground mt-1">
                Configure a URL do Apps Script primeiro.{" "}
                <Link to="/setup" className="text-primary underline">
                  Configurar agora
                </Link>
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !apiConfigured}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Padrão inicial: <span className="font-mono">admin / admin</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}