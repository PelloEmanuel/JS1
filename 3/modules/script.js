// ===== Modo claro / oscuro =====
const botonTema = document.getElementById('botonTema');

function aplicarTema(tema) {
  document.documentElement.setAttribute('data-tema', tema);
  botonTema.textContent = tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro';
}

aplicarTema(localStorage.getItem('tema') || 'claro');

botonTema.addEventListener('click', () => {
  const actual = document.documentElement.getAttribute('data-tema');
  const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro';
  localStorage.setItem('tema', nuevo);
  aplicarTema(nuevo);
});

// ===== Avisos propios (sin alert) =====
function mostrarToast(texto, tipo) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + tipo;
  toast.textContent = texto;
  document.getElementById('toasts').appendChild(toast);
  setTimeout(() => toast.remove(), 3000); // se cierra solo
}

function decir(id, texto, tipo) {
  const aviso = document.getElementById(id);
  aviso.textContent = texto;
  aviso.className = 'aviso ' + tipo;
  mostrarToast(texto, tipo);
}

// ===== Proyecto 3: almacén de personas en localStorage =====
const CLAVE = 'personas';
const formulario = document.getElementById('formulario');
const formularioEdicion = document.getElementById('formularioEdicion');
const listaPersonas = document.getElementById('listaPersonas');
const contador = document.getElementById('contador');
const fondoModal = document.getElementById('fondoModal');
const fondoConfirmar = document.getElementById('fondoConfirmar');

// Definición de los campos: con ella se arman el formulario de carga y el de edición
const definicion = [
  { n: 'nombre', etiqueta: 'Nombre', tipo: 'text' },
  { n: 'apellido', etiqueta: 'Apellido', tipo: 'text' },
  { n: 'nacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'date' },
  { n: 'sexo', etiqueta: 'Sexo', tipo: 'radio', ancho: true, opciones: ['Masculino', 'Femenino', 'Otro'] },
  { n: 'documento', etiqueta: 'Documento (7 u 8 números)', tipo: 'text' },
  { n: 'estadoCivil', etiqueta: 'Estado civil', tipo: 'select',
    opciones: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión convivencial'] },
  { n: 'nacionalidad', etiqueta: 'Nacionalidad', tipo: 'text' },
  { n: 'telefono', etiqueta: 'Teléfono', tipo: 'text' },
  { n: 'mail', etiqueta: 'Mail', tipo: 'text' },
  { n: 'ciudad', etiqueta: 'Ciudad de residencia', tipo: 'text' },
  { n: 'tieneHijos', etiqueta: '¿Tiene hijos?', tipo: 'select', opciones: [['si', 'Sí'], ['no', 'No']] },
  { n: 'cantidadHijos', etiqueta: '¿Cuántos hijos?', tipo: 'number' }
];
const campos = definicion.map(c => c.n);

function campoHTML(c, prefijo) {
  let control;
  if (c.tipo === 'radio') {
    control = '<div class="radios">' + c.opciones.map(o =>
      '<label><input type="radio" name="' + c.n + '" value="' + o + '"> ' + o + '</label>').join('') + '</div>';
  } else if (c.tipo === 'select') {
    control = '<select id="' + prefijo + c.n + '" name="' + c.n + '"><option value="">Elegí...</option>' +
      c.opciones.map(o => {
        const par = Array.isArray(o) ? o : [o, o];
        return '<option value="' + par[0] + '">' + par[1] + '</option>';
      }).join('') + '</select>';
  } else {
    const extra = c.tipo === 'date' ? ' min="1900-01-01"' : (c.tipo === 'number' ? ' min="0"' : '');
    control = '<input id="' + prefijo + c.n + '" name="' + c.n + '" type="' + c.tipo + '"' + extra + '>';
  }
  const oculto = c.n === 'cantidadHijos' ? ' hidden' : '';
  const para = c.tipo === 'radio' ? '' : ' for="' + prefijo + c.n + '"';
  return '<div class="campo' + (c.ancho ? ' campo-ancho' : '') + '" data-campo="' + c.n + '"' + oculto + '><label' + para + '>' + c.etiqueta + '</label>' +
    control + '<small class="error-campo" data-error="' + c.n + '"></small></div>';
}

document.getElementById('camposNuevo').innerHTML = definicion.map(c => campoHTML(c, 'n-')).join('');
document.getElementById('camposEdicion').innerHTML = definicion.map(c => campoHTML(c, 'e-')).join('');

// ----- Almacén -----
let personas = cargar();

function cargar() {
  let lista;
  try {
    lista = JSON.parse(localStorage.getItem(CLAVE)) || [];
  } catch (error) {
    lista = [];
  }
  lista.forEach((p, i) => { if (!p.id) p.id = Date.now() + i; }); // cada persona tiene un id propio
  return lista;
}

function guardarEnAlmacen() {
  localStorage.setItem(CLAVE, JSON.stringify(personas));
}

// ----- Lectura y validación (sirven para los dos formularios) -----
function valor(form, campo) {
  return form.elements[campo].value.trim(); // para los radios devuelve la opción marcada
}

// Para comparar: del teléfono solo los números, del mail todo en minúsculas
function comparable(campo, v) {
  if (campo === 'telefono') return v.replace(/\D/g, '');
  if (campo === 'mail') return v.toLowerCase();
  return v;
}

// ¿Otra persona (distinta de la que se está editando) ya tiene este dato?
function repetida(campo, v, idActual) {
  return personas.some(p => p.id !== idActual && comparable(campo, p[campo]) === comparable(campo, v));
}

const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]+$/;

// Cada regla devuelve '' si está bien, o el mensaje de error
const reglas = {
  nombre: v => soloLetras.test(v) && v.length >= 2 && v.length <= 40 ? '' : 'Ingresá un nombre de 2 a 40 letras.',
  apellido: v => soloLetras.test(v) && v.length >= 2 && v.length <= 40 ? '' : 'Ingresá un apellido de 2 a 40 letras.',
  nacimiento: v => {
    if (!v) return 'Elegí la fecha de nacimiento.';
    const fecha = new Date(v + 'T00:00:00');
    if (fecha > new Date()) return 'La fecha no puede ser futura.';
    if (fecha.getFullYear() < 1900) return 'La fecha no puede ser anterior a 1900.';
    return '';
  },
  sexo: v => v ? '' : 'Elegí una opción.',
  documento: (v, form, id) => {
    if (!/^\d{7,8}$/.test(v)) return 'El documento debe tener 7 u 8 números, sin puntos.';
    return repetida('documento', v, id) ? 'Ya existe una persona con ese documento.' : '';
  },
  estadoCivil: v => v ? '' : 'Elegí un estado civil.',
  nacionalidad: v => soloLetras.test(v) && v.length >= 3 && v.length <= 40 ? '' : 'Ingresá una nacionalidad válida (solo letras).',
  telefono: (v, form, id) => {
    const digitos = v.replace(/\D/g, '');
    if (!/^[\d\s+\-()]+$/.test(v) || digitos.length < 8 || digitos.length > 15) return 'El teléfono debe tener entre 8 y 15 números.';
    return repetida('telefono', v, id) ? 'Ya existe una persona con ese teléfono.' : '';
  },
  mail: (v, form, id) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ingresá un mail válido, por ejemplo nombre@correo.com.';
    return repetida('mail', v, id) ? 'Ya existe una persona con ese mail.' : '';
  },
  ciudad: v => v.length >= 2 && v.length <= 60 ? '' : 'Ingresá una ciudad de 2 a 60 caracteres.',
  tieneHijos: v => v ? '' : 'Indicá si tiene hijos.',
  cantidadHijos: (v, form) => {
    if (valor(form, 'tieneHijos') !== 'si') return '';
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 ? '' : 'La cantidad de hijos debe ser un entero mayor a 1.';
  }
};

// Valida un campo y muestra su error. Devuelve true si está bien.
function validarCampo(form, campo, idActual) {
  const mensaje = reglas[campo](valor(form, campo), form, idActual);
  form.querySelector('[data-error="' + campo + '"]').textContent = mensaje;
  if (campo !== 'sexo') {
    const elemento = form.elements[campo];
    elemento.classList.toggle('invalido', mensaje !== '');
    elemento.classList.toggle('valido', mensaje === '' && elemento.value.trim() !== '');
  }
  return mensaje === '';
}

function validarTodo(form, idActual) {
  let todoBien = true;
  campos.forEach(campo => {
    if (!validarCampo(form, campo, idActual)) todoBien = false;
  });
  return todoBien;
}

function limpiarErrores(form) {
  form.querySelectorAll('.error-campo').forEach(e => { e.textContent = ''; });
  form.querySelectorAll('.valido, .invalido').forEach(e => e.classList.remove('valido', 'invalido'));
}

// Muestra el campo "cuántos hijos" solo si corresponde
function actualizarHijos(form) {
  const mostrar = valor(form, 'tieneHijos') === 'si';
  form.querySelector('[data-campo="cantidadHijos"]').hidden = !mostrar;
  if (!mostrar) {
    form.elements['cantidadHijos'].value = '';
    form.querySelector('[data-error="cantidadHijos"]').textContent = '';
    form.elements['cantidadHijos'].classList.remove('valido', 'invalido');
  }
}

function leerPersona(form) {
  const persona = {};
  campos.forEach(campo => { persona[campo] = valor(form, campo); });
  if (persona.tieneHijos === 'no') persona.cantidadHijos = '0';
  return persona;
}

function alCambiar(evento, form, idActual) {
  const campo = evento.target.name;
  if (!campo) return;
  if (campo === 'tieneHijos') actualizarHijos(form);
  validarCampo(form, campo, idActual);
}

// ----- Formulario de carga -----
['input', 'change'].forEach(tipo => {
  formulario.addEventListener(tipo, e => alCambiar(e, formulario, null));
  formularioEdicion.addEventListener(tipo, e => alCambiar(e, formularioEdicion, personaAbierta ? personaAbierta.id : null));
});

formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  if (!validarTodo(formulario, null)) {
    decir('aviso', 'No se pudo guardar: revisá los campos marcados en rojo.', 'error');
    const primero = formulario.querySelector('.invalido');
    if (primero) primero.focus();
    return;
  }
  const persona = leerPersona(formulario);
  persona.id = Date.now();
  personas.push(persona);
  guardarEnAlmacen();
  dibujarLista();
  formulario.reset();
  actualizarHijos(formulario);
  limpiarErrores(formulario);
  decir('aviso', persona.nombre + ' ' + persona.apellido + ' se guardó correctamente.', 'ok');
});

// ----- Ventana de ver / editar -----
let personaAbierta = null;
let editando = false;

function modoEdicion(editar) {
  editando = editar;
  formularioEdicion.querySelectorAll('input, select').forEach(el => { el.disabled = !editar; });
  document.getElementById('tituloModal').textContent = editar ? 'Editar persona' : 'Datos de la persona';
  document.getElementById('botonesVer').hidden = editar;
  document.getElementById('botonesEditar').hidden = !editar;
}

function cargarEnModal(persona) {
  campos.forEach(campo => {
    if (campo !== 'cantidadHijos') formularioEdicion.elements[campo].value = persona[campo];
  });
  actualizarHijos(formularioEdicion);
  if (persona.tieneHijos === 'si') formularioEdicion.elements['cantidadHijos'].value = persona.cantidadHijos;
  limpiarErrores(formularioEdicion);
}

function abrirModal(persona, editar) {
  personaAbierta = persona;
  cargarEnModal(persona);
  modoEdicion(editar);
  const avisoModal = document.getElementById('avisoModal');
  avisoModal.textContent = '';
  avisoModal.className = 'aviso';
  fondoModal.hidden = false;
}

function cerrarModal() {
  fondoModal.hidden = true;
  personaAbierta = null;
}

document.getElementById('botonEditarModal').addEventListener('click', () => modoEdicion(true));
document.getElementById('botonCerrarModal').addEventListener('click', cerrarModal);
document.getElementById('botonCancelarEdicion').addEventListener('click', () => {
  cargarEnModal(personaAbierta); // vuelve a los datos guardados
  modoEdicion(false);
});

formularioEdicion.addEventListener('submit', evento => {
  evento.preventDefault();
  if (!editando || !personaAbierta) return;
  if (!validarTodo(formularioEdicion, personaAbierta.id)) {
    decir('avisoModal', 'No se pudieron guardar los cambios: revisá los campos en rojo.', 'error');
    return;
  }
  Object.assign(personaAbierta, leerPersona(formularioEdicion));
  guardarEnAlmacen();
  dibujarLista();
  const nombre = personaAbierta.nombre + ' ' + personaAbierta.apellido;
  cerrarModal();
  decir('aviso', 'Los datos de ' + nombre + ' se actualizaron correctamente.', 'ok');
});

// ----- Confirmación para eliminar -----
let personaAEliminar = null;

function pedirConfirmacion(persona) {
  personaAEliminar = persona;
  document.getElementById('textoConfirmar').textContent =
    '¿Seguro que querés eliminar a ' + persona.nombre + ' ' + persona.apellido + '? Esta acción no se puede deshacer.';
  fondoConfirmar.hidden = false;
}

function cerrarConfirmacion() {
  fondoConfirmar.hidden = true;
  personaAEliminar = null;
}

document.getElementById('botonEliminar').addEventListener('click', () => {
  const nombre = personaAEliminar.nombre + ' ' + personaAEliminar.apellido;
  personas = personas.filter(p => p.id !== personaAEliminar.id);
  guardarEnAlmacen();
  dibujarLista();
  cerrarConfirmacion();
  decir('aviso', nombre + ' se eliminó correctamente.', 'ok');
});
document.getElementById('botonConservar').addEventListener('click', cerrarConfirmacion);

document.addEventListener('keydown', evento => {
  if (evento.key !== 'Escape') return;
  if (!fondoConfirmar.hidden) cerrarConfirmacion();
  else if (!fondoModal.hidden) cerrarModal();
});

// ----- Listado de nombres -----
function dibujarLista() {
  listaPersonas.innerHTML = '';
  contador.textContent = personas.length;
  if (personas.length === 0) {
    const vacio = document.createElement('li');
    vacio.textContent = 'Todavía no hay personas guardadas.';
    listaPersonas.appendChild(vacio);
    return;
  }
  personas.forEach(persona => {
    const item = document.createElement('li');

    const nombre = document.createElement('button');
    nombre.type = 'button';
    nombre.className = 'nombre-persona';
    nombre.textContent = persona.nombre + ' ' + persona.apellido;
    nombre.addEventListener('click', () => abrirModal(persona, false));

    const botonEditar = document.createElement('button');
    botonEditar.type = 'button';
    botonEditar.className = 'btn btn-sec btn-chico-sec';
    botonEditar.textContent = 'Editar';
    botonEditar.addEventListener('click', () => abrirModal(persona, true));

    const botonBorrar = document.createElement('button');
    botonBorrar.type = 'button';
    botonBorrar.className = 'btn btn-chico';
    botonBorrar.textContent = 'Eliminar';
    botonBorrar.addEventListener('click', () => pedirConfirmacion(persona));

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.appendChild(botonEditar);
    acciones.appendChild(botonBorrar);

    item.appendChild(nombre);
    item.appendChild(acciones);
    listaPersonas.appendChild(item);
  });
}

dibujarLista();
