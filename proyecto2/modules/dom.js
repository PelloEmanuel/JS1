/**
 * dom.js — Proyecto 2
 * Funciones de renderizado, estadísticas y utilidades DOM.
 * Exporta todo lo necesario para que main.js pueda
 * construir y actualizar la interfaz de artículos.
 */

/**
 * Muestra un mensaje temporal de estado en #msgEstado.
 * @param {string} mensaje - Texto a mostrar
 * @param {string} tipo    - Clase Bootstrap: success | danger | warning | info
 */
export function mostrarMensaje(mensaje, tipo = "success") {
  const el = document.getElementById("msgEstado");
  el.className = `alert alert-${tipo}`;
  el.textContent = mensaje;
  el.classList.remove("d-none");
  setTimeout(() => el.classList.add("d-none"), 3000);
}

/**
 * Renderiza la tabla de artículos y actualiza estadísticas.
 * Crea filas dinámicas con botones de editar/eliminar.
 * También actualiza los contadores de estadísticas (total, precio máx/mín, stock).
 * @param {Array} articulos - Array de artículos a mostrar
 * @param {string} filtro   - Texto de búsqueda para filtrar (vacío = mostrar todos)
 */
export function renderizarTabla(articulos, filtro = "") {
  const tbody     = document.getElementById("bodyArticulos");
  const filaVacia = document.getElementById("filaVacia");
  const total     = document.getElementById("totalLista");
  const contNav   = document.getElementById("contadorNav");

  // Filtra si hay texto de búsqueda
  const lista = filtro
    ? articulos.filter(a =>
        a.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        (a.categoria || "").toLowerCase().includes(filtro.toLowerCase())
      )
    : articulos;

  // Limpia filas previas
  [...tbody.querySelectorAll("tr.fila-art")].forEach(tr => tr.remove());

  total.textContent  = lista.length;
  contNav.textContent = `${articulos.length} artículo${articulos.length !== 1 ? "s" : ""}`;

  if (lista.length === 0) {
    filaVacia.classList.remove("d-none");
    actualizarStats([]);
    return;
  }

  filaVacia.classList.add("d-none");
  actualizarStats(articulos);

  lista.forEach((a, i) => {
    const tr = document.createElement("tr");
    tr.classList.add("fila-art");
    tr.dataset.id = a.id;
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${a.nombre}</td>
      <td><span class="badge bg-primary">${a.categoria || "—"}</span></td>
      <td>$${Number(a.precio || 0).toLocaleString("es-AR")}</td>
      <td>${a.marca || "—"}</td>
      <td>${a.stock || 0}</td>
      <td>${a.color || "—"}</td>
      <td>${a.peso ? a.peso + " kg" : "—"}</td>
      <td><span class="badge bg-secondary">${a.metodo || "push"}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-warning me-1 btn-editar" data-id="${a.id}">✏️</button>
        <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${a.id}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Actualiza las tarjetas de estadísticas:
 * total, precio máximo, precio mínimo y stock total.
 * @param {Array} articulos - Array completo de artículos
 */
function actualizarStats(articulos) {
  document.getElementById("statTotal").textContent = articulos.length;

  if (articulos.length === 0) {
    document.getElementById("statPrecioMax").textContent = "$0";
    document.getElementById("statPrecioMin").textContent = "$0";
    document.getElementById("statStock").textContent = "0";
    return;
  }

  const precios = articulos.map(a => Number(a.precio || 0));
  const stocks  = articulos.map(a => Number(a.stock || 0));

  document.getElementById("statPrecioMax").textContent =
    "$" + Math.max(...precios).toLocaleString("es-AR");
  document.getElementById("statPrecioMin").textContent =
    "$" + Math.min(...precios).toLocaleString("es-AR");
  document.getElementById("statStock").textContent =
    stocks.reduce((acc, s) => acc + s, 0);
}

/**
 * Aplica o elimina el tema oscuro en el elemento raíz <html>.
 * @param {boolean} oscuro - true para modo oscuro
 */
export function aplicarTema(oscuro) {
  document.documentElement.setAttribute("data-theme", oscuro ? "dark" : "light");
  document.getElementById("btnTema").textContent = oscuro ? "☀️ Claro" : "🌙 Oscuro";
}