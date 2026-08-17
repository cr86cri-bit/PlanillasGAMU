import { solicitarApi } from "../api/clienteApi.js";

export async function invocarFuncion(nombreFuncion, cuerpo = {}) {
  return solicitarApi(`funciones/${nombreFuncion}`, {
    metodo: "POST",
    cuerpo,
  });
}
