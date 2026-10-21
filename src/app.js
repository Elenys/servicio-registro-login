/**
 * Arma la aplicación Express: lectura de JSON, rutas y manejo de errores.
 *
 * Se separa de servidor.js para que las pruebas puedan crear la aplicación
 * con un repositorio en memoria, sin tocar el archivo de datos real.
 */
import express from "express";

import { crearRutasAutenticacion } from "./rutas/autenticacion.js";
import { crearServicioAutenticacion } from "./servicios/autenticacion.js";

export function crearApp(repositorio) {
  const app = express();
  const servicio = crearServicioAutenticacion(repositorio);

  // Convierte el cuerpo JSON de la petición en peticion.body (máximo 10 KB).
  app.use(express.json({ limit: "10kb" }));

  // Página de inicio: describe el servicio y sus rutas.
  app.get("/", (_peticion, respuesta) => {
    respuesta.json({
      servicio: "Registro e inicio de sesión — MediCitas",
      rutas: ["POST /api/registro", "POST /api/login"],
    });
  });

  app.use("/api", crearRutasAutenticacion(servicio));

  // Cualquier otra ruta no existe.
  app.use((_peticion, respuesta) => {
    respuesta.status(404).json({ mensaje: "Ruta no encontrada." });
  });

  // Manejo central de errores (Express 5 también captura los errores de funciones async).
  // eslint-disable-next-line no-unused-vars
  app.use((error, _peticion, respuesta, _siguiente) => {
    if (error.type === "entity.parse.failed") {
      return respuesta.status(400).json({ mensaje: "El cuerpo de la petición no es un JSON válido." });
    }
    if (error.type === "entity.too.large") {
      return respuesta.status(413).json({ mensaje: "El cuerpo de la petición es demasiado grande." });
    }
    console.error(error);
    return respuesta.status(500).json({ mensaje: "Error interno del servidor." });
  });

  return app;
}
