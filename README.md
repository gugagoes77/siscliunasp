# Sistema de Agendamento — Clínica-Escola UNASP

Webapp interno em React + TanStack Start, com backend em **Google Sheets via Apps Script**.

## 1. Configurar o backend (Google Sheets)

1. Crie uma nova planilha no Google Drive (qualquer nome).
2. Vá em **Extensões → Apps Script**.
3. Apague o conteúdo padrão e cole todo o arquivo [`apps-script/Code.gs`](apps-script/Code.gs).
4. Clique em **Salvar**.
5. Clique em **Implantar → Nova implantação**.
   - Tipo: **App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL gerada (termina em `/exec`).

As abas (`usuarios`, `pacientes`, `alunos`, `orientadores`, `sessoes`, `materiais`)
e o usuário inicial **`admin / admin`** são criados automaticamente na primeira chamada.

## 2. Conectar o app

Abra o app, clique em **Configurar agora** na tela de login (ou vá em `/setup`),
cole a URL do Apps Script e salve. Depois entre com `admin / admin` e troque a senha
criando um novo usuário em **Configurações**.

## 3. Funcionalidades

- **Página Principal** — cronograma do dia e da semana, conflitos.
- **Cadastros** — Pacientes (com campos de responsável quando menor de 18), Alunos/Duplas e Orientadores.
- **Agendamento** — sessões com detecção de conflito de sala e aluno; horários fixos por dia da semana.
- **Calendário Geral** — visualização mensal com filtros e detalhes por dia.
- **Reserva de Materiais** — registro de materiais por aluno, sala, data e hora.
- **Envio de Mensagens** — gera mensagens prontas de confirmação (maior/menor de idade) e copia.
- **Configurações** — URL do backend e gestão de usuários.

## Stack

React 19, TanStack Start/Router, TanStack Query, Tailwind v4, shadcn/ui, react-hook-form + zod, date-fns.