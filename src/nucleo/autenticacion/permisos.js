export function usuarioTienePermisoLocal(usuarioActual, permiso) {
  const permisos = usuarioActual?.permisos ?? [];
  return permisos.includes(permiso);
}

export function usuarioTieneTodosLosPermisos(usuarioActual, permisosRequeridos = []) {
  return permisosRequeridos.every((permiso) => usuarioTienePermisoLocal(usuarioActual, permiso));
}

export function usuarioTieneAlgunoDeLosPermisos(usuarioActual, permisosRequeridos = []) {
  if (!usuarioActual) {
    return false;
  }

  if (permisosRequeridos.length === 0) {
    return true;
  }

  return permisosRequeridos.some((permiso) => usuarioTienePermisoLocal(usuarioActual, permiso));
}
