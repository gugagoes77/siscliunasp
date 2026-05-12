export const SALAS = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "Sala de Atendimento Infantil",
] as const;

export type Sala = (typeof SALAS)[number];

export const HORARIOS_SEG_QUI = [
  { inicio: "08:15", fim: "08:50" },
  { inicio: "09:15", fim: "10:05" },
  { inicio: "10:30", fim: "11:20" },
  { inicio: "13:15", fim: "14:05" },
  { inicio: "14:30", fim: "15:20" },
  { inicio: "15:45", fim: "16:35" },
  { inicio: "17:00", fim: "17:50" },
  { inicio: "18:15", fim: "19:05" },
  { inicio: "19:30", fim: "20:20" },
  { inicio: "20:45", fim: "21:35" },
] as const;

export const HORARIOS_SEX = [
  { inicio: "08:15", fim: "08:50" },
  { inicio: "09:15", fim: "10:05" },
  { inicio: "10:30", fim: "11:20" },
  { inicio: "13:15", fim: "14:05" },
  { inicio: "14:30", fim: "15:20" },
] as const;

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function horariosParaData(date: Date) {
  const dow = date.getDay();
  if (dow === 5) return HORARIOS_SEX;
  if (dow >= 1 && dow <= 4) return HORARIOS_SEG_QUI;
  return [];
}

export function diaSemanaLabel(date: Date) {
  return DIAS_SEMANA[date.getDay()];
}