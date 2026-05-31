/**
 * dom.js — Proyecto 1
 * Funciones reutilizables de manipulación del DOM.
 * Exporta utilidades para renderizar la tabla, mostrar mensajes
 * y gestionar el modo claro/oscuro.
 */

/**
 * Muestra un mensaje de estado temporalmente en #msgEstado.
 * @param {string} mensaje  - Texto a mostrar
 * @param {string} tipo     - Clase Bootstrap: "success", "danger", "warning", "info"
 */
export function mostrarMensaje(mensaje, tipo = "success") {
  const el = document.getElementById("msgEstado");
  el.className = `alert alert-${tipo} mt-2`;
  el.textContent = mensaje;
  el.classList.remove("d-none");

  // Oculta automáticamente después de 3 segundos
  setTimeout(() => el.classList.add("d-none"), 3000);
}

/**
 * Renderiza la tabla de usuarios con los datos recibidos.
 * Crea filas dinámicas con botones de editar y eliminar.
 * Actualiza el contador de usuarios en navbar y card header.
 * @param {Array} usuarios - Array de objetos usuario desde el servidor
 */
export function renderizarTabla(usuarios) {
  const tbody = document.getElementById("bodyUsuarios");
  const filaVacia = document.getElementById("filaVacia");
  const total = document.getElementById("totalUsuarios");
  const contNav = document.getElementById("contadorNav");

  // Limpia filas previas sin eliminar la fila vacía
  [...tbody.querySelectorAll("tr.fila-usuario")].forEach(tr => tr.remove());

  total.textContent = usuarios.length;
  contNav.textContent = `${usuarios.length} usuario${usuarios.length !== 1 ? "s" : ""}`;

  if (usuarios.length === 0) {
    filaVacia.classList.remove("d-none");
    return;
  }

  filaVacia.classList.add("d-none");

  usuarios.forEach((u, i) => {
    const tr = document.createElement("tr");
    tr.classList.add("fila-usuario");
    tr.dataset.id = u.id;

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${u.nombre}</td>
      <td>${u.email || "—"}</td>
      <td>${u.ciudad || "—"}</td>
      <td><span class="badge bg-info text-dark">${u.metodo || "—"}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1 btn-editar" data-id="${u.id}">✏️</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${u.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Activa o desactiva el modo oscuro en el elemento <html>.
 * Actualiza el texto del botón según el tema activo.
 * @param {boolean} oscuro - true para activar modo oscuro
 */
export function aplicarTema(oscuro) {
  document.documentElement.setAttribute("data-theme", oscuro ? "dark" : "light");
  const btn = document.getElementById("btnTema");
  btn.textContent = oscuro ? "☀️ Claro" : "🌙 Oscuro";
}

/**
 * Muestra un panel de tab y oculta el resto.
 * @param {string} idTab - ID del div de tab a mostrar (ej: "forma1")
 */
export function mostrarTab(idTab) {
  document.querySelectorAll(".tab-contenido").forEach(el => {
    el.classList.toggle("d-none", el.id !== idTab);
  });
  document.querySelectorAll("#tabFormas .nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === idTab);
  });
}