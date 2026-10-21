# Servicio web de registro e inicio de sesión

Evidencia **GA7-220501096-AA5-EV01 — Diseño y desarrollo de servicios web (caso)**  
Programa Análisis y Desarrollo de Software — SENA  
Autora: **Carlas Elenys Montalvo Mendoza**

Servicio web REST que permite **registrar** un usuario y **iniciar sesión** con usuario y
contraseña. Si la autenticación es correcta responde *"Autenticación satisfactoria."*; si no,
responde un *error en la autenticación*. Hace parte del proyecto formativo **MediCitas**, que
también está construido sobre Node.js.

## Tecnologías

- **Node.js** 20 o superior (probado con Node 26).
- **Express 5**: servidor HTTP y rutas.
- **bcryptjs**: las contraseñas se guardan como hash bcrypt, nunca en texto plano.
- **node:test**: pruebas automáticas incluidas en Node (sin librerías extra).
- **Git** para el versionamiento; repositorio en GitHub (ver `enlace_repositorio.txt`).

## Diseño

```
src/
  servidor.js                  Punto de entrada: carga los usuarios y abre el puerto
  app.js                       Aplicación Express: JSON, rutas, 404 y manejo de errores
  rutas/autenticacion.js       Capa HTTP: POST /api/registro y POST /api/login
  servicios/autenticacion.js   Reglas de negocio: registrar e iniciar sesión (bcrypt)
  servicios/validaciones.js    Validación de usuario y contraseña
  datos/repositorioUsuarios.js Almacenamiento de usuarios en un archivo JSON
pruebas/
  autenticacion.test.js        12 pruebas con peticiones HTTP reales
```

Cada capa solo conoce a la de abajo: las **rutas** traducen HTTP ⇄ resultados, el **servicio**
aplica las reglas y el **repositorio** guarda los datos. Así las pruebas pueden usar un
repositorio en memoria sin tocar el archivo real.

Los usuarios se guardan en `datos/usuarios.json` (se crea solo al registrar el primero y no se
sube al repositorio):

```json
[{ "usuario": "carlas", "hashContrasena": "$2b$10$…", "creadoEn": "2026-10-21T16:58:51.955Z" }]
```

## Instalación y ejecución

```bash
npm install
npm start        # http://localhost:3001
npm test         # pruebas automáticas
```

Variables opcionales: `PUERTO` (por defecto `3001`) y `ARCHIVO_DATOS` (por defecto
`datos/usuarios.json`).

## Endpoints

Todas las peticiones y respuestas usan JSON (`Content-Type: application/json`).

### `POST /api/registro`

Cuerpo: `{ "usuario": "carlas", "contrasena": "Medicitas2026" }`

Reglas: el usuario tiene de 4 a 30 caracteres (letras, números, `.`, `-`, `_`) y no distingue
mayúsculas; la contraseña tiene al menos 8 caracteres.

| Código | Cuándo | Respuesta |
|---|---|---|
| 201 | Usuario creado | `{ "mensaje": "Usuario registrado correctamente.", "usuario": "carlas" }` |
| 400 | Faltan datos o no cumplen las reglas | `{ "mensaje": "Datos inválidos.", "errores": { "usuario": "…", "contrasena": "…" } }` |
| 409 | El usuario ya existe | `{ "mensaje": "El usuario ya está registrado." }` |

### `POST /api/login`

Cuerpo: `{ "usuario": "carlas", "contrasena": "Medicitas2026" }`

| Código | Cuándo | Respuesta |
|---|---|---|
| 200 | Usuario y contraseña correctos | `{ "mensaje": "Autenticación satisfactoria.", "usuario": "carlas" }` |
| 400 | Falta el usuario o la contraseña | `{ "mensaje": "Datos inválidos.", "errores": { … } }` |
| 401 | Usuario inexistente o contraseña incorrecta | `{ "mensaje": "Error en la autenticación: usuario o contraseña incorrectos." }` |

Por seguridad, el error 401 es el mismo si el usuario no existe o si la contraseña está mal,
y ambos casos tardan lo mismo: así no se puede averiguar qué usuarios están registrados.

### Otras respuestas

- `GET /` → descripción del servicio y sus rutas.
- Ruta inexistente → `404 { "mensaje": "Ruta no encontrada." }`
- JSON mal formado → `400 { "mensaje": "El cuerpo de la petición no es un JSON válido." }`

## Ejemplo con curl

```bash
curl -X POST http://localhost:3001/api/registro \
  -H "Content-Type: application/json" \
  -d '{"usuario":"carlas","contrasena":"Medicitas2026"}'

curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"carlas","contrasena":"Medicitas2026"}'
```
