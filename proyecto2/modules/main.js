/**
 * main.js — Proyecto 2
 * Orquesta eventos, fetch al servidor y actualización del DOM.
 *
 * Demuestra distintos métodos de almacenaje en arrays:
 *   push()    → agrega al final
 *   unshift() → agrega al inicio
 *   splice()  → inserta en posición específica
 *   concat()  → genera nuevo array concatenando
 *
 * El array local actúa como caché en memoria; la persistencia
 * real ocurre siempre en /data/articulos.txt vía el servidor.
 */

import { mostrarMensaje, renderizarTabla, aplicarTema } from "./dom.js";

let modoOscuro = false;

/**
 * Cache local de artículos.
 * Se sincroniza con el servidor en cada operación CRUD.
 * No es el almacenamiento principal — ese rol lo cumple el .txt.
 */
let cacheArticulos = [];

// ─── Inicialización ──────────────────────────────────────────────────────────

cargarArticulos();
configurarEventos();

// ─── Carga ───────────────────────────────────────────────────────────────────

/** Carga artículos desde el servidor y actualiza cache + tabla */
async function cargarArticulos() {
  const res = await fetch("/articulos");
  cacheArticulos = await res.json();
  renderizarTabla(cacheArticulos);
}

// ─── Eventos ─────────────────────────────────────────────────────────────────

/**
 * Registra todos los event listeners.
 * Usa: submit, click, input para cumplir variedad obligatoria.
 */
function configurarEventos() {

  // Tema claro/oscuro (click)
  document.getElementById("btnTema").addEventListener("click", () => {
    modoOscuro = !modoOscuro;
    aplicarTema(modoOscuro);
  });

  // Limpiar formulario (click)
  document.getElementById("btnLimpiar").addEventListener("click", () => {
    document.getElementById("formArticulo").reset();
  });

  /**
   * Evento submit del formulario principal.
   * Valida los campos requeridos y envía el artículo al servidor.
   * Demuestra el método de almacenaje elegido en el select.
   */
  document.getElementById("formArticulo").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const articulo = recogerDatos();
    await agregarArticulo(articulo);
    document.getElementById("formArticulo").reset();
  });

  /**
   * Evento input en el buscador.
   * Filtra la tabla en tiempo real sin llamar al servidor.
   */
  document.getElementById("buscador").addEventListener("input", (e) => {
    renderizarTabla(cacheArticulos, e.target.value.trim());
  });

  /**
   * Delegación de eventos en el tbody para editar y eliminar.
   * Un solo listener maneja todos los botones dinámicos.
   */
  document.getElementById("bodyArticulos").addEventListener("click", async (e) => {
    const btnEditar   = e.target.closest(".btn-editar");
    const btnEliminar = e.target.closest(".btn-eliminar");

    if (btnEditar)   abrirModalEdicion(Number(btnEditar.dataset.id));
    if (btnEliminar) await eliminarArticulo(Number(btnEliminar.dataset.id));
  });

  // Confirmar edición desde modal (click)
  document.getElementById("btnConfirmarEdicion").addEventListener("click", async () => {
    await confirmarEdicion();
  });

  // Descargar .txt (click)
  document.getElementById("btnDescargar").addEventListener("click", descargarTxt);
}

// ─── Validación ──────────────────────────────────────────────────────────────

/**
 * Valida los campos obligatorios del formulario.
 * Muestra mensajes de error dinámicamente en el DOM.
 * @returns {boolean} true si todos los campos obligatorios son válidos
 */
function validarFormulario() {
  let valido = true;

  const nombre    = document.getElementById("fNombre").value.trim();
  const categoria = document.getElementById("fCategoria").value;
  const precio    = Number(document.getElementById("fPrecio").value);
  const stock     = Number(document.getElementById("fStock").value);

  const errNombre    = document.getElementById("err_nombre");
  const errCategoria = document.getElementById("err_categoria");
  const errPrecio    = document.getElementById("err_precio");
  const errStock     = document.getElementById("err_stock");

  errNombre.classList.toggle("d-none", nombre !== "");
  if (!nombre) valido = false;

  errCategoria.classList.toggle("d-none", categoria !== "");
  if (!categoria) valido = false;

  errPrecio.classList.toggle("d-none", !isNaN(precio) && precio >= 0 && document.getElementById("fPrecio").value !== "");
  if (document.getElementById("fPrecio").value === "" || isNaN(precio) || precio < 0) valido = false;

  errStock.classList.toggle("d-none", !isNaN(stock) && stock >= 0 && document.getElementById("fStock").value !== "");
  if (document.getElementById("fStock").value === "" || isNaN(stock) || stock < 0) valido = false;

  return valido;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Recopila los valores del formulario en un objeto artículo.
 * @returns {object} artículo con todos los campos del formulario
 */
function recogerDatos() {
  return {
    nombre:      document.getElementById("fNombre").value.trim(),
    categoria:   document.getElementById("fCategoria").value,
    precio:      Number(document.getElementById("fPrecio").value),
    marca:       document.getElementById("fMarca").value.trim(),
    stock:       Number(document.getElementById("fStock").value),
    color:       document.getElementById("fColor").value.trim(),
    peso:        document.getElementById("fPeso").value,
    descripcion: document.getElementById("fDescripcion").value.trim(),
    metodo:      document.getElementById("fMetodo").value,
  };
}

/**
 * Demuestra el método de almacenaje seleccionado en el cache local.
 * El resultado final se envía al servidor para persistencia real en .txt.
 *
 * Métodos demostrados:
 *   push    → cacheArticulos.push(art)
 *   unshift → cacheArticulos.unshift(art)
 *   splice  → cacheArticulos.splice(posiciónMedia, 0, art)
 *   concat  → cacheArticulos = cacheArticulos.concat([art])
 *
 * @param {object} art - Artículo ya guardado en el servidor (con id)
 */
function aplicarMetodoAlmacenaje(art) {
  const metodo = art.metodo;
  if (metodo === "push") {
    cacheArticulos.push(art);
  } else if (metodo === "unshift") {
    cacheArticulos.unshift(art);
  } else if (metodo === "splice") {
    const mitad = Math.floor(cacheArticulos.length / 2);
    cacheArticulos.splice(mitad, 0, art);
  } else if (metodo === "concat") {
    cacheArticulos = cacheArticulos.concat([art]);
  }
}

/**
 * Envía el artículo al servidor, actualiza el cache local
 * con el método de almacenaje elegido y re-renderiza la tabla.
 * @param {object} articulo - Datos del artículo a agregar
 */
async function agregarArticulo(articulo) {
  const res  = await fetch("/articulos", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(articulo),
  });
  const data = await res.json();

  if (data.ok) {
    articulo.id = data.id;
    aplicarMetodoAlmacenaje(articulo);
    renderizarTabla(cacheArticulos);
    mostrarMensaje(
      `"${articulo.nombre}" agregado con método ${articulo.metodo}().`,
      "success"
    );
  } else {
    mostrarMensaje("Error al guardar el artículo.", "danger");
  }
}

/**
 * Envía DELETE al servidor, elimina del cache y actualiza tabla.
 * @param {number} id - id del artículo a eliminar
 */
async function eliminarArticulo(id) {
  const res  = await fetch(`/articulos/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.ok) {
    cacheArticulos = cacheArticulos.filter(a => a.id !== id);
    renderizarTabla(cacheArticulos);
    mostrarMensaje("Artículo eliminado.", "warning");
  }
}

/**
 * Pre-rellena el modal con los datos del artículo a editar.
 * @param {number} id - id del artículo
 */
function abrirModalEdicion(id) {
  const a = cacheArticulos.find(a => a.id === id);
  if (!a) return;

  document.getElementById("editId").value          = a.id;
  document.getElementById("editNombre").value      = a.nombre;
  document.getElementById("editCategoria").value   = a.categoria || "";
  document.getElementById("editPrecio").value      = a.precio || "";
  document.getElementById("editMarca").value       = a.marca || "";
  document.getElementById("editStock").value       = a.stock || "";
  document.getElementById("editColor").value       = a.color || "";
  document.getElementById("editPeso").value        = a.peso || "";
  document.getElementById("editDescripcion").value = a.descripcion || "";

  new bootstrap.Modal(document.getElementById("modalEditar")).show();
}

/**
 * Recoge datos del modal y envía PUT al servidor.
 * Actualiza el cache local y cierra el modal.
 */
async function confirmarEdicion() {
  const id = Number(document.getElementById("editId").value);
  const datos = {
    nombre:      document.getElementById("editNombre").value.trim(),
    categoria:   document.getElementById("editCategoria").value,
    precio:      Number(document.getElementById("editPrecio").value),
    marca:       document.getElementById("editMarca").value.trim(),
    stock:       Number(document.getElementById("editStock").value),
    color:       document.getElementById("editColor").value.trim(),
    peso:        document.getElementById("editPeso").value,
    descripcion: document.getElementById("editDescripcion").value.trim(),
  };

  if (!datos.nombre) {
    mostrarMensaje("El nombre no puede estar vacío.", "danger");
    return;
  }

  const res  = await fetch(`/articulos/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(datos),
  });
  const data = await res.json();

  if (data.ok) {
    const idx = cacheArticulos.findIndex(a => a.id === id);
    if (idx !== -1) cacheArticulos[idx] = { ...cacheArticulos[idx], ...datos };
    bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
    renderizarTabla(cacheArticulos);
    mostrarMensaje("Artículo actualizado.", "info");
  }
}

/**
 * Descarga el archivo articulos.txt en la computadora del usuario.
 * Usa Blob + URL.createObjectURL + <a download>.
 * El servidor ya guardó el archivo en /data automáticamente.
 */
async function descargarTxt() {
  if (cacheArticulos.length === 0) {
    mostrarMensaje("No hay artículos para descargar.", "warning");
    return;
  }
  const contenido = JSON.stringify(cacheArticulos, null, 2);
  const blob = new Blob([contenido], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "articulos.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  mostrarMensaje("Archivo descargado.", "success");
}