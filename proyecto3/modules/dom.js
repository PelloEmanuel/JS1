/**
 * dom.js — Proyecto 3
 * Funciones de manipulación del DOM para el almacén de personas.
 * Exporta renderizado de lista, tabla, mensajes y tema.
 */

/**
 * Muestra un mensaje de estado en #msgEstado con clase Bootstrap.
 * Se oculta automáticamente después de 4 segundos.
 * @param {string} mensaje
 * @param {string} tipo - success | danger | warning | info
 */
export function mostrarMensaje(mensaje, tipo = "success") {
  const el = document.getElementById("msgEstado");
  el.className = `alert alert-${tipo} mt-3`;
  el.textContent = mensaje;
  el.classList.remove("d-none");
  setTimeout(() => el.classList.add("d-none"), 4000);
}

/**
 * Muestra u oculta el mensaje de error bajo un campo específico.
 * También aplica/quita clases visuales de validación al input.
 * @param {string} idCampo  - ID del input/select
 * @param {string} idError  - ID del div de error
 * @param {string} mensaje  - Texto de error (vacío = campo válido)
 */
export function mostrarErrorCampo(idCampo, idError, mensaje) {
  const campo = document.getElementById(idCampo);
  const err   = document.getElementById(idError);
  if (!campo || !err) return;

  err.textContent = mensaje;
  campo.classList.toggle("campo-invalido", mensaje !== "");
  campo.classList.toggle("campo-valido",   mensaje === "");
}

/**
 * Renderiza la lista lateral de nombres completos.
 * Cada ítem muestra "Apellido, Nombre" con botones de editar/eliminar.
 * @param {Array} personas
 */
export function renderizarLista(personas) {
  const lista    = document.getElementById("listaPersonas");
  const itemVac  = document.getElementById("itemVacio");
  const total    = document.getElementById("totalPersonas");
  const contNav  = document.getElementById("contadorNav");

  // Elimina ítems dinámicos previos
  [...lista.querySelectorAll("li.item-persona")].forEach(li => li.remove());

  total.textContent  = personas.length;
  contNav.textContent = `${personas.length} persona${personas.length !== 1 ? "s" : ""}`;

  if (personas.length === 0) {
    itemVac.classList.remove("d-none");
    return;
  }

  itemVac.classList.add("d-none");

  personas.forEach(p => {
    const li = document.createElement("li");
    li.classList.add("list-group-item", "d-flex",
      "justify-content-between", "align-items-center", "item-persona");
    li.dataset.id = p.id;

    li.innerHTML = `
      <span>
        <strong>${p.apellido}, ${p.nombre}</strong>
        <span class="text-muted small ms-1">(${p.edad} años)</span>
      </span>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-warning btn-editar" data-id="${p.id}">✏️</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${p.id}">🗑️</button>
      </div>
    `;
    lista.appendChild(li);
  });
}

/**
 * Renderiza la tabla detallada de personas con todos los campos.
 * @param {Array} personas
 */
export function renderizarTabla(personas) {
  const tbody    = document.getElementById("bodyPersonas");
  const filaVac  = document.getElementById("filaTablVacia");

  [...tbody.querySelectorAll("tr.fila-persona")].forEach(tr => tr.remove());

  if (personas.length === 0) {
    filaVac.classList.remove("d-none");
    return;
  }

  filaVac.classList.add("d-none");

  personas.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.classList.add("fila-persona");
    tr.dataset.id = p.id;

    const hijos = p.tieneHijos === "si"
      ? `Sí (${p.cantHijos})`
      : "No";

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.apellido}, ${p.nombre}</td>
      <td>${p.edad}</td>
      <td>${p.sexo}</td>
      <td>${p.documento}</td>
      <td>${p.estadoCivil}</td>
      <td>${p.telefono}</td>
      <td>${p.mail}</td>
      <td>${hijos}</td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1 btn-editar" data-id="${p.id}">✏️</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${p.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Aplica el tema claro/oscuro al documento y actualiza el botón.
 * @param {boolean} oscuro
 */
export function aplicarTema(oscuro) {
  document.documentElement.setAttribute("data-theme", oscuro ? "dark" : "light");
  document.getElementById("btnTema").textContent = oscuro ? "☀️ Claro" : "🌙 Oscuro";
}

/**
 * Rellena el formulario con los datos de una persona para edición.
 * @param {object} persona
 */
export function rellenarFormulario(persona) {
  document.getElementById("editandoId").value    = persona.id;
  document.getElementById("fNombre").value       = persona.nombre;
  document.getElementById("fApellido").value     = persona.apellido;
  document.getElementById("fEdad").value         = persona.edad;
  document.getElementById("fFechaNac").value     = persona.fechaNac;
  document.getElementById("fSexo").value         = persona.sexo;
  document.getElementById("fDocumento").value    = persona.documento;
  document.getElementById("fEstadoCivil").value  = persona.estadoCivil;
  document.getElementById("fNacionalidad").value = persona.nacionalidad;
  document.getElementById("fTelefono").value     = persona.telefono;
  document.getElementById("fMail").value         = persona.mail;
  document.getElementById("fTieneHijos").value   = persona.tieneHijos;

  const containerHijos = document.getElementById("containerHijos");
  if (persona.tieneHijos === "si") {
    containerHijos.classList.remove("d-none");
    document.getElementById("fCantHijos").value = persona.cantHijos || "";
  } else {
    containerHijos.classList.add("d-none");
  }

  document.getElementById("tituloFormulario").textContent = "Editando persona";
  document.getElementById("btnGuardar").textContent       = "Actualizar persona";
}

/**
 * Resetea el formulario y los mensajes de validación a su estado inicial.
 */
export function limpiarFormulario() {
  document.getElementById("formPersona").reset();
  document.getElementById("editandoId").value = "";
  document.getElementById("tituloFormulario").textContent = "Agregar persona";
  document.getElementById("btnGuardar").textContent       = "Guardar persona";
  document.getElementById("containerHijos").classList.add("d-none");

  // Limpia todos los mensajes de error y clases de validación
  const campos = ["fNombre","fApellido","fEdad","fFechaNac","fSexo",
    "fDocumento","fEstadoCivil","fNacionalidad","fTelefono","fMail","fCantHijos"];
  const errores = ["err_nombre","err_apellido","err_edad","err_fechaNac","err_sexo",
    "err_documento","err_estadoCivil","err_nacionalidad","err_telefono","err_mail","err_hijos"];

  campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("campo-invalido","campo-valido");
    }
  });
  errores.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}