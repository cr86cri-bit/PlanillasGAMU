import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { usuarioTienePermisoLocal } from "../src/nucleo/autenticacion/permisos.js";

const sql = readFileSync(
  "cloudflare/migrations/0001_esquema_inicial.sql",
  "utf8",
);

describe("permisos y seguridad Cloudflare D1", () => {
  it("rechaza usuario sin permisos", () => {
    expect(usuarioTienePermisoLocal({ permisos: ["asistencia.ver"] }, "roles.gestionar")).toBe(
      false,
    );
  });

  it("incluye roles y permisos base", () => {
    expect(sql).toContain("'Administrador'");
    expect(sql).toContain("'Recursos Humanos'");
    expect(sql).toContain("'Consulta'");
    expect(sql).toContain("'roles.gestionar'");
    expect(sql).toContain("'asistencia.ver'");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS sesiones");
  });

  it("no contiene grants anonimos heredados", () => {
    expect(sql).not.toMatch(/\bgrant\b[^;]+\bto\s+anon\b/i);
    expect(sql).not.toMatch(/\bauth\.uid\(\)/i);
  });
});
