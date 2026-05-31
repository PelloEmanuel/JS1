/**
 * main.js — Proyecto 1
 * Punto de entrada: conecta eventos del DOM con las funciones
 * de dom.js y realiza las peticiones fetch al servidor Express.
 *
 * Demuestra las 3 formas de lectura de formularios en JavaScript:
 *   1) new FormData(form)
 *   2) document.querySelector / getElementById
 *   3) form.elements[name]
 */

import { mostrarMensaje, renderizarTabla, aplicarTema, mostrarTab } from "./dom.js";

let modoOscuro = false;

// ─── Inicialización ──────────────────────────────────────────────────────────

/**
 * Al cargar el módulo, carga los usuarios existentes del servidor
 * y configura todos los eventos de la interfaz.
 */
cargarUsuarios();
configurarEventos();

// ─── Carga inicial ───────────────────────────────────────────────────────────

/**
 * Obtiene los usuarios desde GET /obtener-usuarios y renderiza la tabla.
 * No recarga la página (SPA dinámico).
 */
async function cargarUsuarios() {
  const res = await fetch("/obtener-usuarios");
  const usuarios = await res.json();
  renderizarTabla(usuarios);
}

// ─── Configuración de eventos ────────────────────────────────────────────────

/**
 * Registra todos los event listeners de la aplicación.
 * Usa: submit, click, input para variedad de eventos.
 */
function configurarEventos() {

  // ── Tabs de navegación (evento: click) ──────────────────────────────────
  document.querySelectorAll("#tabFormas .nav-link").forEach(btn => {
    btn.addEventListener("click", () => mostrarTab(btn.dataset.tab));
  });

  // ── Toggle modo oscuro (evento: click) ──────────────────────────────────
  document.getElementById("btnTema").addEventListener("click", () => {
    modoOscuro = !modoOscuro;
    aplicarTema(modoOscuro);
  });

  // ── FORMA 1: FormData (evento: submit) ──────────────────────────────────
  /**
   * Evento submit en el formulario.
   * Lee todos los campos usando new FormData(form), itera con .entries().
   * Previene recarga con event.preventDefault().
   */
  document.getElementById("formFormData").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const usuario = {};
    for (const [key, value] of data.entries()) {
      usuario[key] = value.trim();
    }
    usuario.metodo = "FormData";

    if (!validarCampos(usuario.nombre, usuario.email)) return;

    await guardarUsuario(usuario);
    form.reset();
  });

  // ── FORMA 2: querySelector / getElementById (evento: click) ─────────────
  /**
   * Evento click en el botón de guardar.
   * Lee cada campo individualmente con document.getElementById().
   */
  document.getElementById("btnGuardarQS").addEventListener("click", async () => {
    const nombre = document.getElementById("qs_nombre").value.trim();
    const email  = document.getElementById("qs_email").value.trim();
    const ciudad = document.getElementById("qs_ciudad").value.trim();

    // Muestra/oculta mensajes de error en línea
    document.getElementById("qs_err_nombre").classList.toggle("d-none", nombre !== "");
    document.getElementById("qs_err_email").classList.toggle("d-none", email !== "" && email.includes("@"));

    if (!validarCampos(nombre, email)) return;

    await guardarUsuario({ nombre, email, ciudad, metodo: "querySelector" });

    document.getElementById("qs_nombre").value = "";
    document.getElementById("qs_email").value  = "";
    document.getElementById("qs_ciudad").value = "";
  });

  // ── Validación en tiempo real con input ─────────────────────────────────
  /**
   * Evento input: valida el campo email de forma 2 mientras el usuario escribe.
   * Proporciona feedback inmediato sin esperar al submit.
   */
  document.getElementById("qs_email").addEventListener("input", (e) => {
    const val = e.target.value.trim();
    const err = document.getElementById("qs_err_email");
    err.classList.toggle("d-none", val === "" || val.includes("@"));
  });

  // ── FORMA 3: form.elements[] (evento: submit) ────────────────────────────
  /**
   * Evento submit en el formulario.
   * Lee los campos accediendo a form.elements por nombre de campo.
   */
  document.getElementById("formElements").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    const nombre = form.elements["nombre"].value.trim();
    const email  = form.elements["email"].value.trim();
    const ciudad = form.elements["ciudad"].value.trim();

    document.getElementById("el_err_nombre").classList.toggle("d-none", nombre !== "");
    document.getElementById("el_err_email").classList.toggle("d-none", email !== "" && email.includes("@"));

    if (!validarCampos(nombre, email)) return;

    await guardarUsuario({ nombre, email, ciudad, metodo: "elements[]" });
    form.reset();
  });

  // ── Acciones de la tabla: editar y eliminar (evento: click delegado) ─────
  /**
   * Delegación de eventos en el tbody.
   * Un único listener maneja todos los botones editar/eliminar dinámicos.
   */
  document.getElementById("bodyUsuarios").addEventListener("click", async (e) => {
    const btnEditar   = e.target.closest(".btn-editar");
    const btnEliminar = e.target.closest(".btn-eliminar");

    if (btnEditar) {
      abrirModalEdicion(Number(btnEditar.dataset.id));
    }
    if (btnEliminar) {
      await eliminarUsuario(Number(btnEliminar.dataset.id));
    }
  });

  // ── Confirmar edición (evento: click) ───────────────────────────────────
  document.getElementById("btnConfirmarEdicion").addEventListener("click", async () => {
    await confirmarEdicion();
  });

  // ── Descargar .txt (evento: click) ──────────────────────────────────────
  document.getElementById("btnDescargar").addEventListener("click", descargarTxt);
}

// ─── Funciones de negocio ────────────────────────────────────────────────────

/**
 * Valida que el nombre no esté vacío y que el email sea básicamente válido.
 * @param {string} nombre
 * @param {string} email
 * @returns {boolean} true si válido
 */
function validarCampos(nombre, email) {
  if (!nombre) {
    mostrarMensaje("El nombre es obligatorio.", "danger");
    return false;
  }
  if (!email || !email.includes("@")) {
    mostrarMensaje("Ingresá un email válido.", "danger");
    return false;
  }
  return true;
}

/**
 * Envía un nuevo usuario al servidor mediante POST /guardar-usuario.
 * Luego actualiza la tabla en pantalla sin recargar la página.
 * @param {object} usuario - Datos del usuario a guardar
 */
async function guardarUsuario(usuario) {
  const res = await fetch("/guardar-usuario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario)
  });
  const data = await res.json();

  if (data.ok) {
    mostrarMensaje(`Usuario "${usuario.nombre}" guardado correctamente.`, "success");
    await cargarUsuarios();
  } else {
    mostrarMensaje("Error al guardar.", "danger");
  }
}

/**
 * Elimina un usuario del servidor y actualiza la tabla.
 * @param {number} id - id del usuario a eliminar
 */
async function eliminarUsuario(id) {
  const res = await fetch(`/eliminar-usuario/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.ok) {
    mostrarMensaje("Usuario eliminado.", "warning");
    await cargarUsuarios();
  }
}

/**
 * Abre el modal de edición y pre-rellena los campos con los datos del usuario.
 * @param {number} id - id del usuario a editar
 */
async function abrirModalEdicion(id) {
  const res = await fetch("/obtener-usuarios");
  const usuarios = await res.json();
  const u = usuarios.find(u => u.id === id);
  if (!u) return;

  document.getElementById("editId").value     = u.id;
  document.getElementById("editNombre").value = u.nombre;
  document.getElementById("editEmail").value  = u.email || "";
  document.getElementById("editCiudad").value = u.ciudad || "";

  const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
  modal.show();
}

/**
 * Recoge los valores del modal y envía PUT /editar-usuario/:id al servidor.
 * Cierra el modal y actualiza la tabla al terminar.
 */
async function confirmarEdicion() {
  const id     = Number(document.getElementById("editId").value);
  const nombre = document.getElementById("editNombre").value.trim();
  const email  = document.getElementById("editEmail").value.trim();
  const ciudad = document.getElementById("editCiudad").value.trim();

  if (!nombre) {
    mostrarMensaje("El nombre no puede estar vacío.", "danger");
    return;
  }

  const res = await fetch(`/editar-usuario/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, ciudad })
  });
  const data = await res.json();

  if (data.ok) {
    bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
    mostrarMensaje("Usuario actualizado.", "info");
    await cargarUsuarios();
  }
}

/**
 * Descarga el archivo usuarios.txt en la computadora del usuario.
 * Usa Blob + URL.createObjectURL + <a download> (sin APIs externas).
 * Simultáneamente el servidor ya tiene el archivo guardado en /data.
 */
async function descargarTxt() {
  const res = await fetch("/obtener-usuarios");
  const usuarios = await res.json();

  if (usuarios.length === 0) {
    mostrarMensaje("No hay usuarios para descargar.", "warning");
    return;
  }

  const contenido = JSON.stringify(usuarios, null, 2);
  const blob = new Blob([contenido], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "usuarios.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarMensaje("Archivo descargado correctamente.", "success");
}