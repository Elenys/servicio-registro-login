/**
 * Rutas HTTP del servicio:
 *
 *   POST /api/registro  -> crea un usuario
 *   POST /api/login     -> verifica usuario y contraseña
 *
 * Las dos reciben un JSON { "usuario": "...", "contrasena": "..." } y responden
 * siempre JSON con un campo "mensaje".
 */
import { Router } from "express";

export function crearRutasAutenticacion(servicio) {
  const rutas = Router();

  rutas.post("/registro", async (peticion, respuesta) => {
    const resultado = await servicio.registrar(peticion.body ?? {});

    if (resultado.ok) {
      return respuesta.status(201).json({
        mensaje: "Usuario registrado correctamente.",
        usuario: resultado.usuario,
      });
    }
    if (resultado.motivo === "usuario_existente") {
      return respuesta.status(409).json({ mensaje: "El usuario ya está registrado." });
    }
    return respuesta
      .status(400)
      .json({ mensaje: "Datos inválidos.", errores: resultado.errores });
  });

  rutas.post("/login", async (peticion, respuesta) => {
    const resultado = await servicio.iniciarSesion(peticion.body ?? {});

    if (resultado.ok) {
      return respuesta.status(200).json({
        mensaje: "Autenticación satisfactoria.",
        usuario: resultado.usuario,
      });
    }
    if (resultado.motivo === "credenciales_invalidas") {
      // El mensaje no dice si falló el usuario o la contraseña.
      return respuesta
        .status(401)
        .json({ mensaje: "Error en la autenticación: usuario o contraseña incorrectos." });
    }
    return respuesta
      .status(400)
      .json({ mensaje: "Datos inválidos.", errores: resultado.errores });
  });

  return rutas;
}
