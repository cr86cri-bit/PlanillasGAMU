import { solicitarApi } from "../api/clienteApi.js";

function conTiempoLimite(promesa, milisegundos = 6000) {
  let temporizador;

  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => {
      rechazar(new Error("La verificación tardó demasiado."));
    }, milisegundos);
  });

  return Promise.race([promesa, limite]).finally(() => clearTimeout(temporizador));
}

export async function iniciarSesion(correo, contrasena) {
  return solicitarApi("auth/login", {
    metodo: "POST",
    cuerpo: { correo, contrasena },
  });
}

export async function cerrarSesion() {
  return solicitarApi("auth/logout", { metodo: "POST", cuerpo: {} });
}

export async function obtenerSesionActual() {
  const usuario = await obtenerUsuarioActual();
  return usuario ? { user: usuario } : null;
}

export async function obtenerUsuarioActual() {
  try {
    return await conTiempoLimite(solicitarApi("auth/user"));
  } catch {
    return null;
  }
}

export async function crearAdministradorInicial({ correo, contrasena, nombreMostrado }) {
  return solicitarApi("auth/setup", {
    metodo: "POST",
    cuerpo: { correo, contrasena, nombre_mostrado: nombreMostrado },
  });
}

export async function obtenerEstadoInicialAutenticacion() {
  return conTiempoLimite(solicitarApi("auth/estado-inicial"));
}
