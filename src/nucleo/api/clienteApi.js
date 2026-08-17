import { lanzarSiError } from "../errores/manejadorErrores.js";

export async function solicitarApi(ruta, { metodo = "GET", cuerpo, senal } = {}) {
  const respuesta = await fetch(`/api/${ruta.replace(/^\/+/, "")}`, {
    method: metodo,
    credentials: "include",
    cache: "no-store",
    headers: cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    signal: senal,
  });

  const tipoContenido = respuesta.headers.get("content-type") ?? "";
  const datos = tipoContenido.includes("application/json") ? await respuesta.json() : null;

  if (!respuesta.ok || datos?.correcto === false) {
    lanzarSiError(
      {
        message:
          datos?.mensaje ??
          datos?.error ??
          `La API respondió con estado ${respuesta.status}.`,
      },
      "No se pudo completar la solicitud.",
    );
  }

  return datos?.datos ?? datos;
}
