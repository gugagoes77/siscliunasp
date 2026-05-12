import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { alunosApi, pacientesApi, sessoesApi } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/mensagens")({
  component: MensagensPage,
  head: () => ({ meta: [{ title: "Mensagens — UNASP" }] }),
});

function MensagensPage() {
  const sessoes = sessoesApi.useList();
  const alunos = alunosApi.useList();
  const pacientes = pacientesApi.useList();

  const [alunoId, setAlunoId] = useState("");
  const [sessaoId, setSessaoId] = useState("");

  const sessoesDoAluno = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (sessoes.data ?? [])
      .filter((s) => s.alunoId === alunoId && s.status !== "cancelada" && parseISO(s.data) >= today)
      .sort((a, b) => (a.data + a.horaInicio).localeCompare(b.data + b.horaInicio));
  }, [sessoes.data, alunoId]);

  const sessao = useMemo(() => sessoesDoAluno.find((s) => s.id === sessaoId), [sessoesDoAluno, sessaoId]);
  const aluno = useMemo(() => (alunos.data ?? []).find((a) => a.id === alunoId), [alunos.data, alunoId]);
  const paciente = useMemo(
    () => sessao ? (pacientes.data ?? []).find((p) => p.id === sessao.pacienteId) : undefined,
    [pacientes.data, sessao],
  );

  const partes = useMemo(() => {
    if (!sessao || !aluno || !paciente) return null;
    const dataObj = parseISO(sessao.data);
    const diaMes = format(dataObj, "dd 'de' MMMM", { locale: ptBR });
    const dia = sessao.diaSemana;
    const hora = sessao.horaInicio;
    if (paciente.menorIdade) {
      return {
        plain: `${paciente.respPrimeiroNome}, estamos entrando em contato para confirmar a sessão de ${paciente.primeiroNome} no dia ${diaMes}, ${dia}, às ${hora}. Ficamos no aguardo. Atenciosamente, ${aluno.nomeCompleto}`,
        rich: (
          <>
            <strong>{paciente.respPrimeiroNome}</strong>, estamos entrando em contato para confirmar a sessão de{" "}
            <strong>{paciente.primeiroNome}</strong> no dia <strong>{diaMes}</strong>, <strong>{dia}</strong>, às{" "}
            <strong>{hora}</strong>. Ficamos no aguardo. Atenciosamente, <strong>{aluno.nomeCompleto}</strong>
          </>
        ),
      };
    }
    return {
      plain: `${paciente.primeiroNome}, estamos entrando em contato para confirmar a sessão no dia ${diaMes}, ${dia}, às ${hora}. Ficamos no aguardo. Atenciosamente, ${aluno.nomeCompleto}`,
      rich: (
        <>
          <strong>{paciente.primeiroNome}</strong>, estamos entrando em contato para confirmar a sessão no dia{" "}
          <strong>{diaMes}</strong>, <strong>{dia}</strong>, às <strong>{hora}</strong>. Ficamos no aguardo.
          Atenciosamente, <strong>{aluno.nomeCompleto}</strong>
        </>
      ),
    };
  }, [sessao, aluno, paciente]);

  async function copy() {
    if (!partes) return;
    await navigator.clipboard.writeText(partes.plain);
    toast.success("Mensagem copiada");
  }

  return (
    <div>
      <PageHeader title="Envio de Mensagens" description="Gere mensagens de confirmação prontas para copiar" />
      <Card className="p-6 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Aluno</Label>
            <Select value={alunoId} onValueChange={(v) => { setAlunoId(v); setSessaoId(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o aluno" /></SelectTrigger>
              <SelectContent>
                {(alunos.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.nomeCompleto}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sessão</Label>
            <Select value={sessaoId} onValueChange={setSessaoId} disabled={!alunoId}>
              <SelectTrigger><SelectValue placeholder={alunoId ? "Selecione a sessão" : "Escolha o aluno primeiro"} /></SelectTrigger>
              <SelectContent>
                {sessoesDoAluno.map((s) => {
                  const p = (pacientes.data ?? []).find((x) => x.id === s.pacienteId);
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      {format(parseISO(s.data), "dd/MM")} {s.horaInicio} – {p ? `${p.primeiroNome} ${p.sobrenome}` : "?"}
                    </SelectItem>
                  );
                })}
                {sessoesDoAluno.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">Sem sessões futuras.</div>}
              </SelectContent>
            </Select>
          </div>
        </div>

        {partes && (
          <div className="rounded-xl border bg-muted/30 p-5 leading-relaxed">
            <p>{partes.rich}</p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={copy} disabled={!partes}><Copy className="h-4 w-4" /> Copiar mensagem</Button>
        </div>
      </Card>
    </div>
  );
}