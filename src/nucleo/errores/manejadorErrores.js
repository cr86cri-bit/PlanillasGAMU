export class ErrorAplicacion extends Error {
  constructor(mensaje, detalle = null) {
    super(mensaje);
    this.name = "ErrorAplicacion";
    this.detalle = detalle;
  }
}

export function traducirError(error) {
  if (!error) {
    return "Ocurrió un error inesperado.";
  }

  const mensaje = error.message ?? String(error);

  if (mensaje.includes("Invalid login credentials")) {
    return "El correo o la contraseña no son correctos.";
  }

  if (mensaje.includes("JWT")) {
    return "La sesión no es válida o ha vencido. Vuelve a iniciar sesión.";
  }

  if (mensaje.includes("permission denied") || mensaje.includes("42501")) {
    return "No tienes permisos suficientes para realizar esta acción.";
  }

  if (mensaje.includes("duplicate key")) {
    return "Ya existe un registro con los mismos datos únicos.";
  }

  return mensaje;
}

export function lanzarSiError(error, mensaje) {
  if (error) {
    throw new ErrorAplicacion(mensaje ?? traducirError(error), error);
  }
}
