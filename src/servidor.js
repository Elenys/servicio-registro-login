/**
 * Punto de entrada: carga los usuarios guardados y levanta el servidor HTTP.
 *
 * Variables de entorno opcionales:
 *   PUERTO          puerto HTTP (por defecto 3001; el 3000 lo usa MediCitas)
 *   ARCHIVO_DATOS   archivo JSON de usuarios (por defecto datos/usuarios.json)
 */
import { crearApp } from "./app.js";
import { crearRepositorioUsuarios } from "./datos/repositorioUsuarios.js";

const PUERTO = Number(process.env.PUERTO ?? 3001);
const ARCHIVO_DATOS = process.env.ARCHIVO_DATOS ?? "datos/usuarios.json";

const repositorio = await crearRepositorioUsuarios(ARCHIVO_DATOS);
const app = crearApp(repositorio);

app.listen(PUERTO, () => {
  console.log(`Servicio de registro e inicio de sesión en http://localhost:${PUERTO}`);
});
