/**
 * validaciones.js — Proyecto 3
 * Funciones de validación individuales para cada campo del formulario.
 * Cada función valida una regla específica y retorna un string de error
 * o cadena vacía si el campo es válido.
 */

/**
 * Valida que el texto no esté vacío y tenga longitud mínima.
 * @param {string} valor
 * @param {number} min - Longitud mínima (default 2)
 * @returns {string} Mensaje de error o ""
 */
export function validarTexto(valor, min = 2) {
  if (!valor || valor.trim().length === 0) return "Este campo es obligatorio.";
  if (valor.trim().length < min) return `Mínimo ${min} caracteres.`;
  return "";
}

/**
 * Valida que la edad sea un número entero entre 0 y 120.
 * @param {string} valor
 * @returns {string}
 */
export function validarEdad(valor) {
  if (!valor) return "La edad es obligatoria.";
  const n = Number(valor);
  if (isNaN(n) || !Number.isInteger(n)) return "Debe ser un número entero.";
  if (n < 0 || n > 120) return "Edad inválida (0-120).";
  return "";
}

/**
 * Valida que la fecha de nacimiento no sea en el futuro ni muy antigua.
 * @param {string} valor - Formato YYYY-MM-DD
 * @returns {string}
 */
export function validarFecha(valor) {
  if (!valor) return "La fecha es obligatoria.";
  const fecha = new Date(valor);
  const hoy   = new Date();
  if (isNaN(fecha)) return "Fecha inválida.";
  if (fecha > hoy)  return "La fecha no puede ser futura.";
  if (fecha.getFullYear() < 1900) return "Año demasiado antiguo.";
  return "";
}

/**
 * Valida que se haya seleccionado una opción del select.
 * @param {string} valor
 * @param {string} label - Nombre del campo para el mensaje
 * @returns {string}
 */
export function validarSelect(valor, label = "campo") {
  if (!valor) return `Seleccioná un ${label}.`;
  return "";
}

/**
 * Valida que el documento sea numérico y tenga entre 7 y 10 dígitos.
 * @param {string} valor
 * @returns {string}
 */
export function validarDocumento(valor) {
  if (!valor) return "El documento es obligatorio.";
  if (!/^\d{7,10}$/.test(valor.trim())) return "Debe tener entre 7 y 10 dígitos numéricos.";
  return "";
}

/**
 * Valida formato de email básico.
 * Verifica presencia de @ y dominio con punto.
 * @param {string} valor
 * @returns {string}
 */
export function validarEmail(valor) {
  if (!valor) return "El email es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) return "Email inválido.";
  return "";
}

/**
 * Valida que el teléfono sea numérico y tenga entre 8 y 15 dígitos.
 * @param {string} valor
 * @returns {string}
 */
export function validarTelefono(valor) {
  if (!valor) return "El teléfono es obligatorio.";
  if (!/^\d{8,15}$/.test(valor.trim())) return "Debe tener entre 8 y 15 dígitos.";
  return "";
}

/**
 * Valida cantidad de hijos: entero positivo entre 1 y 20.
 * @param {string} valor
 * @returns {string}
 */
export function validarHijos(valor) {
  if (!valor) return "Ingresá la cantidad de hijos.";
  const n = Number(valor);
  if (isNaN(n) || !Number.isInteger(n) || n < 1 || n > 20) {
    return "Debe ser un número entero entre 1 y 20.";
  }
  return "";
}