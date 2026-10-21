/**
 * Reglas de validación de los datos que llegan al servicio.
 *
 * Cada función devuelve un objeto con los errores por campo; si está vacío,
 * los datos son válidos.
 */

// Usuario: de 4 a 30 caracteres; letras sin tilde, números, punto, guion o guion bajo.
const PATRON_USUARIO = /^[a-zA-Z0-9._-]{4,30}$/;
const MIN_CONTRASENA = 8;
// bcrypt solo tiene en cuenta los primeros 72 bytes de la contraseña.
const MAX_CONTRASENA = 72;

/** Deja el nombre de usuario sin espacios a los lados y en minúsculas ("Carlas" = "carlas"). */
export function normalizarUsuario(usuario) {
  return typeof usuario === "string" ? usuario.trim().toLowerCase() : usuario;
}

/** Valida los datos de un registro nuevo. */
export function validarRegistro({ usuario, contrasena }) {
  const errores = {};

  if (typeof usuario !== "string" || usuario.trim() === "") {
    errores.usuario = "El usuario es obligatorio.";
  } else if (!PATRON_USUARIO.test(usuario.trim())) {
    errores.usuario =
      "El usuario debe tener de 4 a 30 caracteres: letras, números, punto, guion o guion bajo.";
  }

  if (typeof contrasena !== "string" || contrasena === "") {
    errores.contrasena = "La contraseña es obligatoria.";
  } else if (contrasena.length < MIN_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`;
  } else if (Buffer.byteLength(contrasena, "utf-8") > MAX_CONTRASENA) {
    errores.contrasena = `La contraseña no puede superar ${MAX_CONTRASENA} bytes.`;
  }

  return errores;
}

/** En el inicio de sesión solo se exige que vengan los dos campos. */
export function validarInicioSesion({ usuario, contrasena }) {
  const errores = {};
  if (typeof usuario !== "string" || usuario.trim() === "") {
    errores.usuario = "El usuario es obligatorio.";
  }
  if (typeof contrasena !== "string" || contrasena === "") {
    errores.contrasena = "La contraseña es obligatoria.";
  }
  return errores;
}
