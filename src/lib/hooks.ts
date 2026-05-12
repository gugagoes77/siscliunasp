import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiCall } from "./sheets-api";
import type { Aluno, Material, Orientador, Paciente, Sessao, Usuario } from "./types";

function makeCrud<T extends { id: string }>(entity: string) {
  return {
    useList: () =>
      useQuery({
        queryKey: [entity],
        queryFn: () => apiCall<T[]>("list", { entity }),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (data: Omit<T, "id">) => apiCall<T>("create", { entity, data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: [entity] }),
      });
    },
    useUpdate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (data: T) => apiCall<T>("update", { entity, data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: [entity] }),
      });
    },
    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => apiCall<{ id: string }>("delete", { entity, id }),
        onSuccess: () => qc.invalidateQueries({ queryKey: [entity] }),
      });
    },
  };
}

export const pacientesApi = makeCrud<Paciente>("pacientes");
export const alunosApi = makeCrud<Aluno>("alunos");
export const orientadoresApi = makeCrud<Orientador>("orientadores");
export const sessoesApi = makeCrud<Sessao>("sessoes");
export const materiaisApi = makeCrud<Material>("materiais");
export const usuariosApi = makeCrud<Usuario>("usuarios");