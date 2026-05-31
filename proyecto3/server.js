/**
 * server.js — Proyecto 3
 * Servidor Express para el almacén de personas.
 * Persiste en /data/personas.txt usando fs y ES Modules.
 * El cliente usa localStorage como respaldo secundario.
 */

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = 3003;

app.use(express.json());
app.use("/pages",   express.static(path.join(__dirname, "pages")));
app.use("/style",   express.static(path.join(__dirname, "style")));
app.use("/modules", express.static(path.join(__dirname, "modules")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

/** Ruta al archivo de persistencia, creando /data si no existe */
function getFilePath() {
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  return path.join(dir, "personas.txt");
}

/** Lee y parsea el array de personas desde /data/personas.txt */
function leerPersonas() {
  const fp = getFilePath();
  if (!fs.existsSync(fp)) return [];
  const c = fs.readFileSync(fp, "utf-8").trim();
  if (!c) return [];
  try { return JSON.parse(c); }
  catch { return []; }
}

/** Escribe el array actualizado en /data/personas.txt */
function guardarPersonas(personas) {
  fs.writeFileSync(getFilePath(), JSON.stringify(personas, null, 2), "utf-8");
}

/** POST /personas — Agrega una persona nueva */
app.post("/personas", (req, res) => {
  const persona = req.body;
  if (!persona || !persona.nombre || !persona.apellido) {
    return res.status(400).json({ ok: false, mensaje: "Datos insuficientes." });
  }
  const personas = leerPersonas();
  persona.id = Date.now();
  personas.push(persona);
  guardarPersonas(personas);
  res.json({ ok: true, id: persona.id });
});

/** GET /personas — Devuelve todas las personas */
app.get("/personas", (req, res) => {
  res.json(leerPersonas());
});

/** PUT /personas/:id — Actualiza una persona por id */
app.put("/personas/:id", (req, res) => {
  const id  = Number(req.params.id);
  const upd = req.body;
  const personas = leerPersonas();
  const idx = personas.findIndex(p => p.id === id);
  if (idx === -1) return res.json({ ok: false });
  personas[idx] = { ...personas[idx], ...upd };
  guardarPersonas(personas);
  res.json({ ok: true });
});

/** DELETE /personas/:id — Elimina una persona por id */
app.delete("/personas/:id", (req, res) => {
  const id = Number(req.params.id);
  let personas = leerPersonas();
  personas = personas.filter(p => p.id !== id);
  guardarPersonas(personas);
  res.json({ ok: true });
});

/** GET /descargar — Descarga personas.txt */
app.get("/descargar", (req, res) => {
  const fp = getFilePath();
  if (!fs.existsSync(fp)) return res.status(404).send("Sin datos.");
  res.download(fp, "personas.txt");
});

app.listen(PORT, () => {
  console.log(`Proyecto 3 en http://localhost:${PORT}`);
});