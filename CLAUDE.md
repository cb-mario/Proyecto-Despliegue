# CLAUDE.md — Práctica 1 Despliegue (API REST de eventos)

Este fichero es el contexto del proyecto. Léelo entero antes de escribir código y respétalo al pie de la letra: la práctica se corrige automáticamente contra este protocolo y **cualquier desviación (carpetas, nombres de campos, códigos de estado, mensajes) puntúa 0**.

## 1. Descripción

API REST con **Node.js + Express + Mongoose** que gestiona eventos, sus entradas (subdocumentos) y los recintos donde se celebran. Base de datos MongoDB llamada `eventos` (en local y en MongoDB Atlas). Se desplegará en **Render**.

## 2. Estructura de carpetas OBLIGATORIA

```
practica1/
├── models/
│   ├── evento.js        # esquema entradas (subdoc) + esquema evento + modelo "eventos"
│   └── recinto.js       # esquema recinto + modelo "recintos"
├── routes/
│   ├── eventos.js       # endpoints de eventos y entradas
│   └── recintos.js      # endpoints de recintos
├── index.js             # servidor principal
├── .env                 # PUERTO y URL de la BD (NO se sube a git)
├── .env.example         # mismas claves, sin valores reales
├── .gitignore           # node_modules y .env
└── package.json
```

**PROHIBIDO** (suspende la práctica):
- Crear carpetas `controllers/`, `services/`, `middlewares/`, `config/`, `utils/`, `src/` o cualquier otra que no esté arriba.
- Separar la lógica de los endpoints fuera de `routes/`. Toda la lógica de cada endpoint va dentro del propio enrutador.
- Conectar con la BD en otro fichero que no sea `index.js`.

## 3. Estilo de código (obligatorio y homogéneo)

- **ES Modules** en TODO el proyecto (`import` / `export`), con `"type": "module"` en `package.json`. Nunca `require()`. Al importar ficheros propios incluye la extensión `.js`.
- **`async/await` con `try/catch` en TODOS los endpoints**. No mezclar con `.then()/.catch()`.
- Dependencias: solo `express`, `mongoose` y `dotenv`. No añadir más librerías (ni cors, ni morgan, ni joi, etc.).
- Código sencillo, del nivel visto en clase, con comentarios breves en español. Tengo que poder explicar cada línea en una evaluación oral.
- `package.json` con script `"start": "node index.js"` (Render lo usa).

### Formato de respuesta (TODOS los endpoints)

Éxito:
```json
{ "ok": true, "resultado": ... }
```
Error (400/404/500):
```json
{ "ok": false, "error": "mensaje exacto" }
```
Los nombres de campo son exactamente `ok`, `resultado` y `error` (minúsculas). Nada de `message`, `data`, `msg`, etc.

## 4. Modelos (nombres de campos EXACTOS, respetando mayúsculas/minúsculas)

### `models/evento.js`

Esquema de **entradas** (subdocumento, definido en este mismo fichero):
| Campo | Tipo | Reglas |
|---|---|---|
| `tipo` | String | required, minlength 3 (ej. "VIP", "General") |
| `precio` | Number | required, min 0 |
| `disponibles` | Number | required, min 0, entero (usa un `validate` con `Number.isInteger`) |

Esquema de **eventos**:
| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` | String | required, minlength 5, trim |
| `fecha` | Date | required |
| `entradas` | [esquemaEntradas] | array de subdocumentos |
| `recinto` | ObjectId | required, `ref: 'recintos'` |

Modelo: `mongoose.model('eventos', eventoSchema)` → exportarlo con `export default`.

### `models/recinto.js`

| Campo | Tipo | Reglas |
|---|---|---|
| `nombre` | String | required, minlength 5, trim |
| `direccion` | String | required, minlength 10, trim |
| `localidad` | String | required, minlength 3, trim |
| `aforoMaximo` | Number | NO obligatorio |

Modelo: `mongoose.model('recintos', recintoSchema)` → exportarlo con `export default`.

## 5. Endpoints

Los enrutadores se montan en `index.js` con `app.use('/recintos', recintos)` y `app.use('/eventos', eventos)`. Dentro de cada router las rutas son relativas (`/`, `/:id`, ...).

En los mensajes, `X` es el id recibido en la URL (`req.params.id` o `req.params.idEvento`). Usa template strings: `` `Recinto ${req.params.id} no encontrado` ``.

### `routes/recintos.js`

| Método y ruta | Éxito | Error |
|---|---|---|
| `GET /recintos` | 200 `resultado`: array de recintos (solo si hay ≥1) | **500** `"No se han encontrado recintos"` si no hay ninguno o falla la consulta |
| `GET /recintos/:id` | 200 `resultado`: recinto | 404 `"Recinto X no encontrado"` si es null o hay error (p. ej. id mal formado) |
| `GET /recintos/localidad/:nombre` | 200 `resultado`: array de recintos con esa `localidad` (solo si hay ≥1) | 404 `"No se han encontrado recintos de la localidad indicada"` si está vacío o falla |
| `POST /recintos` | **201** `resultado`: recinto creado (datos en `req.body`) | **500** `"Error añadiendo recinto"` |
| `DELETE /recintos/:id` | 200 `resultado`: recinto eliminado | 404 `"Error eliminando recinto X"` si es null o hay error |

### `routes/eventos.js`

| Método y ruta | Éxito | Error |
|---|---|---|
| `GET /eventos` | 200 `resultado`: array de eventos con **`populate('recinto')`** (y sus entradas), solo si hay ≥1 | **500** `"No se han encontrado eventos"` |
| `GET /eventos/:id` | 200 `resultado`: evento (con `populate('recinto')`) | 404 `"Evento X no encontrado"` si es null o hay error |
| `GET /eventos/localidad/:nombre` | 200 `resultado`: eventos cuyo recinto está en esa localidad **y cuya `fecha` >= ahora** (solo si hay ≥1) | 404 `"No se han encontrado eventos"` |
| `POST /eventos` | **201** `resultado`: evento creado | **500** `"Error añadiendo evento"` |
| `PUT /eventos/:id` | 200 `resultado`: evento **actualizado** (`{ new: true, runValidators: true }`) | 404 `"Error actualizando evento X"` si es null o hay error |
| `DELETE /eventos/:id` | 200 `resultado`: evento eliminado | 404 `"Error eliminando evento X"` si es null o hay error |
| `GET /eventos/entradas/:idEvento/:tipoEntrada` | 200 `resultado: { precio, disponibles }` de la entrada de ese `tipo` en ese evento | 404 `"Error obteniendo datos de entrada para evento X"` si no existe el evento, no existe ese tipo o hay error |
| `PUT /eventos/entradas/:idEvento/:tipoEntrada/:cantidad` | 200 `resultado`: evento completo con las entradas ya actualizadas | 404 `"Error actualizando entradas del evento X"` si falla, no existe, o no hay suficientes `disponibles` |

Notas de implementación:
- **GET /eventos/localidad/:nombre**: forma sencilla → buscar primero los recintos con `localidad` = `:nombre`, sacar sus `_id` y luego `Evento.find({ recinto: { $in: ids }, fecha: { $gte: new Date() } }).populate('recinto')`.
- **PUT entradas**: convertir `:cantidad` a número y comprobar que es un entero > 0 (si no, 404 con el mensaje indicado). Restar con una única operación: `findOneAndUpdate` filtrando por `_id`, y `entradas: { $elemMatch: { tipo, disponibles: { $gte: cantidad } } }`, con `$inc: { 'entradas.$.disponibles': -cantidad }` y `{ new: true }`. Si devuelve null → 404. Así nunca quedan disponibles negativas.
- Si una consulta devuelve `null` o array vacío, se trata como error con el código indicado en la tabla (no devolver 200 vacío).

## 6. `index.js`

Por este orden, como en clase:
1. Importar librerías (`express`, `mongoose`, `dotenv`) y los enrutadores de `routes/`.
2. `dotenv.config()` y conectar a la BD con `mongoose.connect(process.env.URL_BD)`.
3. Crear la app Express y añadir `app.use(express.json())`.
4. Montar los enrutadores: `/recintos` y `/eventos`.
5. `app.listen(process.env.PUERTO, ...)`.

## 7. Variables de entorno (`.env`)

```
PUERTO=8080
URL_BD=mongodb://127.0.0.1:27017/eventos
```
- En Render se configuran las mismas variables en el panel: `URL_BD` con la cadena de **MongoDB Atlas** (incluyendo `/eventos` como base de datos). Usa `process.env.PORT || process.env.PUERTO` para el puerto, porque Render inyecta `PORT`.
- Crea `.env.example` con las mismas claves sin valores reales y añade `.env` y `node_modules/` a `.gitignore`.

## 8. Forma de trabajar

- Antes de crear ficheros, enséñame el plan (lista de ficheros y qué va en cada uno) y espera mi OK.
- Ve por partes: 1) `package.json`, `.env`, `.gitignore`, `index.js`; 2) modelos; 3) `routes/recintos.js`; 4) `routes/eventos.js`. Al acabar cada parte, para y resume lo que has hecho.
- No inventes endpoints, campos ni carpetas que no estén aquí.
- Al terminar, repasa uno por uno los 13 endpoints de la sección 5 comparando código de estado, nombre de campos y texto exacto del mensaje,.a.
