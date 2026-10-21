/**
 * Repositorio de usuarios.
 *
 * Guarda los usuarios en un archivo JSON para que sigan existiendo al reiniciar
 * el servidor. Mientras el servicio corre, los usuarios viven también en memoria
 * (un Map), así las búsquedas no leen el disco en cada petición.
 *
 * Si no se indica archivo, el repositorio trabaja solo en memoria (lo usan las pruebas).
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function crearRepositorioUsuarios(rutaArchivo = null) {
  // Clave: nombre de usuario en minúsculas. Valor: { usuario, hashContrasena, creadoEn }.
  const usuarios = new Map();

  if (rutaArchivo) {
    try {
      const contenido = JSON.parse(await readFile(rutaArchivo, "utf-8"));
      for (const u of contenido) usuarios.set(u.usuario, u);
    } catch (error) {
      // Si el archivo aún no existe se empieza vacío; cualquier otro error sí se reporta.
      if (error.code !== "ENOENT") throw error;
    }
  }

  /** Escribe todos los usuarios en el archivo (primero a uno temporal y luego lo renombra). */
  async function guardar() {
    if (!rutaArchivo) return;
    await mkdir(dirname(rutaArchivo), { recursive: true });
    const temporal = `${rutaArchivo}.tmp`;
    await writeFile(temporal, JSON.stringify([...usuarios.values()], null, 2), "utf-8");
    await rename(temporal, rutaArchivo);
  }

  return {
    /** Devuelve el usuario con ese nombre, o null si no existe. */
    buscar(usuario) {
      return usuarios.get(usuario) ?? null;
    },

    /**
     * Agrega un usuario nuevo. Devuelve false si el nombre ya estaba tomado.
     * La revisión y la inserción ocurren sin pausas (sin await) entre ellas,
     * así dos registros simultáneos del mismo nombre no pueden colarse los dos.
     */
    async agregar(registro) {
      if (usuarios.has(registro.usuario)) return false;
      usuarios.set(registro.usuario, registro);
      await guardar();
      return true;
    },
  };
}
