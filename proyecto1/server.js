/**
 * server.js - Proyecto 1
 * Servidor Express con ES Modules.
 * Gestiona guardado, edición, eliminación y descarga de usuarios en /data/usuarios.txt
 */

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());
app.use("/pages",   express.static(path.join(__dirname, "pages")));
app.use("/style",   express.static(path.join(__dirname, "style")));
app.use("/modules", express.static(path.join(__dirname, "modules")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

/**
 * Devuelve la ruta absoluta al archivo de persistencia.
 * Crea la carpeta /data si no existe.
 */
function getFilePath() {
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  return path.join(dir, "usuarios.txt");
}

/**
 * Lee y parsea el array de usuarios desde el archivo .txt.
 * Retorna [] si el archivo no existe o está vacío.
 */
function leerUsuarios() {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) return [];
  const contenido = fs.readFileSync(filePath, "utf-8").trim();
  if (!contenido) return [];
  try { return JSON.parse(contenido); }
  catch { return []; }
}

/**
 * Persiste el array de usuarios en /data/usuarios.txt usando fs.writeFileSync.
 * @param {Array} usuarios - Array actualizado de usuarios
 */
function guardarUsuarios(usuarios) {
  fs.writeFileSync(getFilePath(), JSON.stringify(usuarios, null, 2), "utf-8");
}

/**
 * POST /guardar-usuario
 * Recibe un usuario desde el cliente y lo agrega al archivo .txt.
 * Asigna un id único basado en timestamp.
 */
app.post("/guardar-usuario", (req, res) => {
  const usuario = req.body;
  if (!usuario || !usuario.nombre) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos." });
  }
  const usuarios = leerUsuarios();
  usuario.id = Date.now();
  usuarios.push(usuario);
  guardarUsuarios(usuarios);
  res.json({ ok: true, id: usuario.id, mensaje: "Usuario guardado correctamente." });
});

/**
 * GET /obtener-usuarios
 * Devuelve todos los usuarios almacenados en el archivo .txt.
 */
app.get("/obtener-usuarios", (req, res) => {
  res.json(leerUsuarios());
});

/**
 * PUT /editar-usuario/:id
 * Actualiza los campos de un usuario existente identificado por su id.
 */
app.put("/editar-usuario/:id", (req, res) => {
  const id = Number(req.params.id);
  const datosNuevos = req.body;
  const usuarios = leerUsuarios();
  const idx = usuarios.findIndex(u => u.id === id);
  if (idx === -1) return res.json({ ok: false, mensaje: "Usuario no encontrado." });
  usuarios[idx] = { ...usuarios[idx], ...datosNuevos };
  guardarUsuarios(usuarios);
  res.json({ ok: true });
});

/**
 * DELETE /eliminar-usuario/:id
 * Elimina un usuario del archivo .txt por su id.
 */
app.delete("/eliminar-usuario/:id", (req, res) => {
  const id = Number(req.params.id);
  let usuarios = leerUsuarios();
  usuarios = usuarios.filter(u => u.id !== id);
  guardarUsuarios(usuarios);
  res.json({ ok: true });
});

/**
 * GET /descargar-usuarios
 * Envía el archivo usuarios.txt para descarga directa en el navegador.
 */
app.get("/descargar-usuarios", (req, res) => {
  const filePath = getFilePath();
  if (!fs.existsSync(filePath)) return res.status(404).send("Sin datos aún.");
  res.download(filePath, "usuarios.txt");
});

app.listen(PORT, () => {
  console.log(`Proyecto 1 en http://localhost:${PORT}`);
});