/**
 * server.js — Proyecto 2
 * Servidor Express para gestionar artículos (deportes/herramientas).
 * Persiste los datos en /data/articulos.txt usando fs y ES Modules.
 */

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = 3002;

app.use(express.json());
app.use("/pages",   express.static(path.join(__dirname, "pages")));
app.use("/style",   express.static(path.join(__dirname, "style")));
app.use("/modules", express.static(path.join(__dirname, "modules")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

/** Retorna la ruta al archivo de persistencia, creando /data si no existe */
function getFilePath() {
  const dir = path.join(__dirname, "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  return path.join(dir, "articulos.txt");
}

/** Lee y parsea el array de artículos desde el archivo .txt */
function leerArticulos() {
  const fp = getFilePath();
  if (!fs.existsSync(fp)) return [];
  const contenido = fs.readFileSync(fp, "utf-8").trim();
  if (!contenido) return [];
  try { return JSON.parse(contenido); }
  catch { return []; }
}

/** Escribe el array de artículos actualizado en /data/articulos.txt */
function guardarArticulos(articulos) {
  fs.writeFileSync(getFilePath(), JSON.stringify(articulos, null, 2), "utf-8");
}

/**
 * POST /articulos
 * Recibe un artículo y lo agrega al archivo .txt con id único.
 */
app.post("/articulos", (req, res) => {
  const art = req.body;
  if (!art || !art.nombre) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos." });
  }
  const articulos = leerArticulos();
  art.id = Date.now();
  articulos.push(art);
  guardarArticulos(articulos);
  res.json({ ok: true, id: art.id });
});

/** GET /articulos — Devuelve todos los artículos del archivo */
app.get("/articulos", (req, res) => {
  res.json(leerArticulos());
});

/**
 * PUT /articulos/:id
 * Actualiza los campos del artículo con el id especificado.
 */
app.put("/articulos/:id", (req, res) => {
  const id  = Number(req.params.id);
  const upd = req.body;
  const articulos = leerArticulos();
  const idx = articulos.findIndex(a => a.id === id);
  if (idx === -1) return res.json({ ok: false });
  articulos[idx] = { ...articulos[idx], ...upd };
  guardarArticulos(articulos);
  res.json({ ok: true });
});

/**
 * DELETE /articulos/:id
 * Elimina el artículo con el id dado del archivo .txt.
 */
app.delete("/articulos/:id", (req, res) => {
  const id = Number(req.params.id);
  let articulos = leerArticulos();
  articulos = articulos.filter(a => a.id !== id);
  guardarArticulos(articulos);
  res.json({ ok: true });
});

/** GET /descargar — Envía articulos.txt para descarga directa */
app.get("/descargar", (req, res) => {
  const fp = getFilePath();
  if (!fs.existsSync(fp)) return res.status(404).send("Sin datos.");
  res.download(fp, "articulos.txt");
});

app.listen(PORT, () => {
  console.log(`Proyecto 2 en http://localhost:${PORT}`);
});