/**
 * Lógica de negocio del registro y del inicio de sesión.
 *
 * No sabe nada de HTTP: recibe datos, aplica las reglas y devuelve un resultado.
 * Las rutas (src/rutas) traducen ese resultado a códigos y respuestas JSON.
 */
import bcrypt from "bcryptjs";

import { normalizarUsuario, validarInicioSesion, validarRegistro } from "./validaciones.js";

// Costo del algoritmo bcrypt: 10 es el valor recomendado por la librería.
const RONDAS_BCRYPT = 10;

// Hash de una contraseña cualquiera. Se compara contra él cuando el usuario no existe,
// para que esa respuesta tarde lo mismo que una contraseña incorrecta y no delate
// qué nombres de usuario están registrados.
const HASH_FICTICIO = bcrypt.hashSync("contrasena-ficticia", RONDAS_BCRYPT);

export function crearServicioAutenticacion(repositorio) {
  return {
    /**
     * Registra un usuario nuevo.
     * Resultados: { ok: true, usuario } | { ok: false, motivo: "datos_invalidos", errores }
     *             | { ok: false, motivo: "usuario_existente" }
     */
    async registrar(datos) {
      const errores = validarRegistro(datos);
      if (Object.keys(errores).length > 0) {
        return { ok: false, motivo: "datos_invalidos", errores };
      }

      const usuario = normalizarUsuario(datos.usuario);
      if (repositorio.buscar(usuario)) {
        return { ok: false, motivo: "usuario_existente" };
      }

      // Nunca se guarda la contraseña: solo su hash con bcrypt (incluye sal aleatoria).
      const hashContrasena = await bcrypt.hash(datos.contrasena, RONDAS_BCRYPT);
      const agregado = await repositorio.agregar({
        usuario,
        hashContrasena,
        creadoEn: new Date().toISOString(),
      });
      // Otro registro con el mismo nombre pudo terminar mientras se calculaba el hash.
      if (!agregado) return { ok: false, motivo: "usuario_existente" };

      return { ok: true, usuario };
    },

    /**
     * Verifica usuario y contraseña.
     * Resultados: { ok: true, usuario } | { ok: false, motivo: "datos_invalidos", errores }
     *             | { ok: false, motivo: "credenciales_invalidas" }
     */
    async iniciarSesion(datos) {
      const errores = validarInicioSesion(datos);
      if (Object.keys(errores).length > 0) {
        return { ok: false, motivo: "datos_invalidos", errores };
      }

      const registro = repositorio.buscar(normalizarUsuario(datos.usuario));
      const coincide = await bcrypt.compare(
        datos.contrasena,
        registro ? registro.hashContrasena : HASH_FICTICIO,
      );

      // Usuario inexistente y contraseña incorrecta dan el mismo resultado a propósito.
      if (!registro || !coincide) return { ok: false, motivo: "credenciales_invalidas" };
      return { ok: true, usuario: registro.usuario };
    },
  };
}
