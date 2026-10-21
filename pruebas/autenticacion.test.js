/**
 * Pruebas del servicio: levantan la aplicación en un puerto libre, con un
 * repositorio en memoria, y le hacen peticiones HTTP reales con fetch.
 *
 * Ejecutar: npm test
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";

import { crearApp } from "../src/app.js";
import { crearRepositorioUsuarios } from "../src/datos/repositorioUsuarios.js";

let servidor;
let base;

before(async () => {
  const app = crearApp(await crearRepositorioUsuarios());
  servidor = app.listen(0);
  await new Promise((listo) => servidor.once("listening", listo));
  base = `http://localhost:${servidor.address().port}`;
});

after(() => servidor.close());

/** Envía un POST con cuerpo JSON y devuelve { estado, cuerpo }. */
async function enviar(ruta, cuerpo) {
  const respuesta = await fetch(base + ruta, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

describe("POST /api/registro", () => {
  test("registra un usuario nuevo", async () => {
    const r = await enviar("/api/registro", { usuario: "carlas", contrasena: "Medicitas2026" });
    assert.equal(r.estado, 201);
    assert.equal(r.cuerpo.mensaje, "Usuario registrado correctamente.");
    assert.equal(r.cuerpo.usuario, "carlas");
    assert.equal(r.cuerpo.hashContrasena, undefined, "nunca se devuelve el hash");
  });

  test("rechaza un usuario repetido, sin importar mayúsculas", async () => {
    const r = await enviar("/api/registro", { usuario: " Carlas ", contrasena: "OtraClave123" });
    assert.equal(r.estado, 409);
    assert.equal(r.cuerpo.mensaje, "El usuario ya está registrado.");
  });

  test("exige usuario y contraseña", async () => {
    const r = await enviar("/api/registro", {});
    assert.equal(r.estado, 400);
    assert.ok(r.cuerpo.errores.usuario);
    assert.ok(r.cuerpo.errores.contrasena);
  });

  test("valida el formato del usuario y el largo de la contraseña", async () => {
    const r = await enviar("/api/registro", { usuario: "a b", contrasena: "corta" });
    assert.equal(r.estado, 400);
    assert.match(r.cuerpo.errores.usuario, /4 a 30 caracteres/);
    assert.match(r.cuerpo.errores.contrasena, /al menos 8/);
  });

  test("responde 400 si el JSON está mal formado", async () => {
    const r = await enviar("/api/registro", "{ usuario: ");
    assert.equal(r.estado, 400);
    assert.equal(r.cuerpo.mensaje, "El cuerpo de la petición no es un JSON válido.");
  });
});

describe("POST /api/login", () => {
  test("autenticación satisfactoria con los datos correctos", async () => {
    const r = await enviar("/api/login", { usuario: "CARLAS", contrasena: "Medicitas2026" });
    assert.equal(r.estado, 200);
    assert.equal(r.cuerpo.mensaje, "Autenticación satisfactoria.");
    assert.equal(r.cuerpo.usuario, "carlas");
  });

  test("error de autenticación con contraseña incorrecta", async () => {
    const r = await enviar("/api/login", { usuario: "carlas", contrasena: "equivocada1" });
    assert.equal(r.estado, 401);
    assert.match(r.cuerpo.mensaje, /^Error en la autenticación/);
  });

  test("usuario inexistente da el mismo error que la contraseña incorrecta", async () => {
    const malaClave = await enviar("/api/login", { usuario: "carlas", contrasena: "equivocada1" });
    const noExiste = await enviar("/api/login", { usuario: "nadie", contrasena: "equivocada1" });
    assert.equal(noExiste.estado, 401);
    assert.deepEqual(noExiste.cuerpo, malaClave.cuerpo);
  });

  test("exige usuario y contraseña", async () => {
    const r = await enviar("/api/login", { usuario: "carlas" });
    assert.equal(r.estado, 400);
    assert.ok(r.cuerpo.errores.contrasena);
  });
});

describe("otras rutas", () => {
  test("GET / describe el servicio", async () => {
    const r = await fetch(base + "/");
    assert.equal(r.status, 200);
    assert.deepEqual((await r.json()).rutas, ["POST /api/registro", "POST /api/login"]);
  });

  test("una ruta desconocida responde 404", async () => {
    const r = await fetch(base + "/api/no-existe");
    assert.equal(r.status, 404);
  });
});

describe("persistencia en archivo", () => {
  test("los usuarios registrados siguen existiendo al reiniciar", async () => {
    const carpeta = await mkdtemp(join(tmpdir(), "usuarios-"));
    const archivo = join(carpeta, "usuarios.json");
    try {
      const primero = await crearRepositorioUsuarios(archivo);
      await primero.agregar({ usuario: "elenys", hashContrasena: "x", creadoEn: "2026-10-21" });

      const reiniciado = await crearRepositorioUsuarios(archivo);
      assert.equal(reiniciado.buscar("elenys").usuario, "elenys");
    } finally {
      await rm(carpeta, { recursive: true, force: true });
    }
  });
});
