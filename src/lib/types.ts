export type Paciente = {
  id: string;
  primeiroNome: string;
  sobrenome: string;
  telefone: string;
  email: string;
  menorIdade: boolean;
  respPrimeiroNome: string;
  respSobrenome: string;
};

export type Aluno = {
  id: string;
  nomeCompleto: string;
  telefone: string;
  semestre: string;
};

export type Orientador = { id: string; nome: string };

export type Sessao = {
  id: string;
  sala: string;
  alunoId: string;
  pacienteId: string;
  data: string; // YYYY-MM-DD
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  status: "agendada" | "cancelada";
};

export type Material = {
  id: string;
  alunoId: string;
  sala: string;
  data: string;
  hora: string;
  material: string;
};

export type Usuario = {
  id: string;
  username: string;
  nome: string;
  role: "admin" | "user";
};