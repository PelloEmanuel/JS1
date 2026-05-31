/**
 * main.js — Proyecto 3
 * Orquesta el CRUD de personas conectando el formulario,
 * validaciones, DOM y servidor Express.
 *
 * Persistencia principal: /data/personas.txt (via Express + fs)
 * Persistencia secundaria: localStorage (respaldo en el navegador)
 *
 * Eventos utilizados: submit, click, change, input, blur
 */

import {
  mostrarMensaje,
  mostrarErrorCampo,
  renderizarLista,
  renderizarTabla,
  aplicarTema,
  rellenarFormulario,
  limpiarFormulario
} from "./dom.js";

import {
  validarTexto,
  validarEdad,
  validarFecha,
  validarSelect,
  validarDocumento,
  validarEmail,
  validarTelefono,
  validarHijos
} from "./validaciones.js";

let modoOscuro = false;

// ─── Inicialización ──────────────────────────────────────────────────────────

cargarPersonas();
configurarEventos();

// ─── Carga de datos ──────────────────────────────────────────────────────────

/**
 * Carga personas desde el servidor y actualiza lista y tabla.
 * También sincroniza localStorage con los datos del servidor.
 */
async function cargarPersonas() {
  const res      = await fetch("/personas");
  const personas = await res.json();

  // Sincroniza localStorage como respaldo
  localStorage.setItem("personas_backup", JSON.stringify(personas));

  renderizarLista(personas);
  renderizarTabla(personas);
}

// ─── Eventos ─────────────────────────────────────────────────────────────────

/**
 * Registra todos los listeners del proyecto.
 * Usa: submit, click, change, input, blur.
 */
function configurarEventos() {

  // Tema (click)
  document.getElementById("btnTema").addEventListener("click", () => {
    modoOscuro = !modoOscuro;
    aplicarTema(modoOscuro);
  });

  // Cancelar / limpiar formulario (click)
  document.getElementById("btnCancelar").addEventListener("click", limpiarFormulario);

  /**
   * Evento change en el select de hijos.
   * Muestra u oculta dinámicamente el campo de cantidad de hijos.
   */
  document.getElementById("fTieneHijos").addEventListener("change", (e) => {
    const container = document.getElementById("containerHijos");
    container.classList.toggle("d-none", e.target.value !== "si");
    if (e.target.value !== "si") {
      document.getElementById("fCantHijos").value = "";
      mostrarErrorCampo("fCantHijos", "err_hijos", "");
    }
  });

  /**
   * Evento blur en campos de texto: valida el campo al perder el foco.
   * Da feedback inmediato al usuario sin esperar el submit.
   */
  document.getElementById("fNombre").addEventListener("blur", (e) => {
    mostrarErrorCampo("fNombre", "err_nombre", validarTexto(e.target.value));
  });
  document.getElementById("fApellido").addEventListener("blur", (e) => {
    mostrarErrorCampo("fApellido", "err_apellido", validarTexto(e.target.value));
  });
  document.getElementById("fEdad").addEventListener("blur", (e) => {
    mostrarErrorCampo("fEdad", "err_edad", validarEdad(e.target.value));
  });
  document.getElementById("fFechaNac").addEventListener("blur", (e) => {
    mostrarErrorCampo("fFechaNac", "err_fechaNac", validarFecha(e.target.value));
  });
  document.getElementById("fDocumento").addEventListener("blur", (e) => {
    mostrarErrorCampo("fDocumento", "err_documento", validarDocumento(e.target.value));
  });

  /**
   * Evento input en el email: valida en tiempo real mientras se escribe.
   */
  document.getElementById("fMail").addEventListener("input", (e) => {
    const err = validarEmail(e.target.value);
    mostrarErrorCampo("fMail", "err_mail", err);
  });

  document.getElementById("fTelefono").addEventListener("blur", (e) => {
    mostrarErrorCampo("fTelefono", "err_telefono", validarTelefono(e.target.value));
  });

  /**
   * Evento submit del formulario principal.
   * Valida todos los campos, y según si hay un id de edición,
   * crea o actualiza la persona.
   * Usa event.preventDefault() para evitar recarga.
   */
  document.getElementById("formPersona").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validarTodo()) return;

    const idEditando = document.getElementById("editandoId").value;

    if (idEditando) {
      await actualizarPersona(Number(idEditando));
    } else {
      await crearPersona();
    }
  });

  /**
   * Delegación de clicks en la lista lateral y tabla.
   * Maneja botones de editar y eliminar generados dinámicamente.
   */
  document.getElementById("listaPersonas").addEventListener("click", async (e) => {
    const btnEditar   = e.target.closest(".btn-editar");
    const btnEliminar = e.target.closest(".btn-eliminar");
    if (btnEditar)   await prepararEdicion(Number(btnEditar.dataset.id));
    if (btnEliminar) await eliminarPersona(Number(btnEliminar.dataset.id));
  });

  document.getElementById("bodyPersonas").addEventListener("click", async (e) => {
    const btnEditar   = e.target.closest(".btn-editar");
    const btnEliminar = e.target.closest(".btn-eliminar");
    if (btnEditar)   await prepararEdicion(Number(btnEditar.dataset.id));
    if (btnEliminar) await eliminarPersona(Number(btnEliminar.dataset.id));
  });

  // Descarga del .txt (click)
  document.getElementById("btnDescargar").addEventListener("click", descargarTxt);
}

// ─── Validación completa ─────────────────────────────────────────────────────

/**
 * Ejecuta todas las validaciones del formulario.
 * Muestra mensajes de error debajo de cada campo fallido.
 * @returns {boolean} true si todos los campos son válidos
 */
function validarTodo() {
  const errores = {
    fNombre:       validarTexto(document.getElementById("fNombre").value),
    fApellido:     validarTexto(document.getElementById("fApellido").value),
    fEdad:         validarEdad(document.getElementById("fEdad").value),
    fFechaNac:     validarFecha(document.getElementById("fFechaNac").value),
    fSexo:         validarSelect(document.getElementById("fSexo").value, "sexo"),
    fDocumento:    validarDocumento(document.getElementById("fDocumento").value),
    fEstadoCivil:  validarSelect(document.getElementById("fEstadoCivil").value, "estado civil"),
    fNacionalidad: validarTexto(document.getElementById("fNacionalidad").value),
    fTelefono:     validarTelefono(document.getElementById("fTelefono").value),
    fMail:         validarEmail(document.getElementById("fMail").value),
  };

  const mapaErrores = {
    fNombre:       "err_nombre",
    fApellido:     "err_apellido",
    fEdad:         "err_edad",
    fFechaNac:     "err_fechaNac",
    fSexo:         "err_sexo",
    fDocumento:    "err_documento",
    fEstadoCivil:  "err_estadoCivil",
    fNacionalidad: "err_nacionalidad",
    fTelefono:     "err_telefono",
    fMail:         "err_mail",
  };

  // Valida campo de hijos si corresponde
  const tieneHijos = document.getElementById("fTieneHijos").value;
  if (tieneHijos === "si") {
    errores.fCantHijos = validarHijos(document.getElementById("fCantHijos").value);
    mapaErrores.fCantHijos = "err_hijos";
  }

  // Aplica los errores en el DOM
  for (const [campo, idErr] of Object.entries(mapaErrores)) {
    mostrarErrorCampo(campo, idErr, errores[campo] || "");
  }

  const hayErrores = Object.values(errores).some(msg => msg !== "");
  if (hayErrores) {
    mostrarMensaje("Corregí los errores marcados antes de continuar.", "danger");
  }

  return !hayErrores;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Recopila todos los valores del formulario en un objeto persona.
 * @returns {object}
 */
function recogerDatos() {
  return {
    nombre:       document.getElementById("fNombre").value.trim(),
    apellido:     document.getElementById("fApellido").value.trim(),
    edad:         Number(document.getElementById("fEdad").value),
    fechaNac:     document.getElementById("fFechaNac").value,
    sexo:         document.getElementById("fSexo").value,
    documento:    document.getElementById("fDocumento").value.trim(),
    estadoCivil:  document.getElementById("fEstadoCivil").value,
    nacionalidad: document.getElementById("fNacionalidad").value.trim(),
    telefono:     document.getElementById("fTelefono").value.trim(),
    mail:         document.getElementById("fMail").value.trim(),
    tieneHijos:   document.getElementById("fTieneHijos").value,
    cantHijos:    document.getElementById("fTieneHijos").value === "si"
                    ? Number(document.getElementById("fCantHijos").value)
                    : 0,
  };
}

/**
 * Envía una nueva persona al servidor vía POST y actualiza la interfaz.
 * También actualiza el backup en localStorage.
 */
async function crearPersona() {
  const persona = recogerDatos();
  const res     = await fetch("/personas", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(persona),
  });
  const data = await res.json();

  if (data.ok) {
    mostrarMensaje(`${persona.nombre} ${persona.apellido} guardado correctamente. ✅`, "success");
    limpiarFormulario();
    await cargarPersonas();
  } else {
    mostrarMensaje("Error al guardar la persona.", "danger");
  }
}

/**
 * Envía los datos actualizados de una persona al servidor vía PUT.
 * @param {number} id - id de la persona a actualizar
 */
async function actualizarPersona(id) {
  const datos = recogerDatos();
  const res   = await fetch(`/personas/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(datos),
  });
  const data = await res.json();

  if (data.ok) {
    mostrarMensaje("Persona actualizada correctamente. ✅", "info");
    limpiarFormulario();
    await cargarPersonas();
  } else {
    mostrarMensaje("Error al actualizar.", "danger");
  }
}

/**
 * Carga los datos de una persona en el formulario para edición.
 * @param {number} id
 */
async function prepararEdicion(id) {
  const res      = await fetch("/personas");
  const personas = await res.json();
  const persona  = personas.find(p => p.id === id);
  if (!persona) return;
  rellenarFormulario(persona);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Elimina una persona del servidor y actualiza la interfaz y localStorage.
 * @param {number} id
 */
async function eliminarPersona(id) {
  const res  = await fetch(`/personas/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (data.ok) {
    mostrarMensaje("Persona eliminada. 🗑️", "warning");
    await cargarPersonas();
  }
}

/**
 * Descarga el archivo personas.txt usando Blob + URL.createObjectURL.
 * El servidor ya tiene el archivo guardado en /data.
 * No usa APIs externas ni showSaveFilePicker().
 */
async function descargarTxt() {
  const res      = await fetch("/personas");
  const personas = await res.json();

  if (personas.length === 0) {
    mostrarMensaje("No hay personas registradas para descargar.", "warning");
    return;
  }

  const contenido = JSON.stringify(personas, null, 2);
  const blob = new Blob([contenido], { type: "text/plain" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "personas.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  mostrarMensaje("Archivo personas.txt descargado.", "success");
}