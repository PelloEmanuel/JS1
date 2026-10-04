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

// ===== Proyecto 2: stock de electrónica, guardar productos en un array =====
let registros = [];
let siguienteId = 1;
const formulario = document.getElementById('formulario');
const formularioEdicion = document.getElementById('formularioEdicion');
const cuerpoTabla = document.getElementById('cuerpoTabla');
const contador = document.getElementById('contador');
const selectForma = document.getElementById('forma');
const campoPosicion = document.getElementById('campoPosicion');
const inputPosicion = document.getElementById('posicion');
const fondoEdicion = document.getElementById('fondoEdicion');
const fondoConfirmar = document.getElementById('fondoConfirmar');
const camposProducto = ['categoria', 'producto', 'marca', 'precio', 'stock', 'fecha', 'estado', 'observaciones'];
let registroEditando = null;
let accionPendiente = null;

const descripciones = {
  push: 'push: agrega al final. Modifica el array original.',
  unshift: 'unshift: agrega al principio. Modifica el array original.',
  splice: 'splice: inserta en la posición que elijas. Modifica el array original.',
  concat: 'concat: crea un array NUEVO con el registro al final.',
  spread: 'spread (...): crea un array NUEVO copiando el anterior y sumando el registro.'
};

function actualizarForma() {
  document.getElementById('descripcionForma').textContent = descripciones[selectForma.value];
  campoPosicion.hidden = selectForma.value !== 'splice';
  inputPosicion.placeholder = '1 a ' + (registros.length + 1);
}

// Sirve para el formulario de carga y para el de edición
function leerFormulario(form) {
  const datos = new FormData(form);
  const registro = {};
  camposProducto.forEach(campo => { registro[campo] = datos.get(campo).trim(); });
  return registro;
}

// ¿Ya hay otro producto igual? (misma categoría, producto, marca, precio y estado)
function esRepetido(registro, idActual) {
  return registros.some(otro =>
    otro.id !== idActual &&
    otro.categoria === registro.categoria &&
    otro.producto.toLowerCase() === registro.producto.toLowerCase() &&
    otro.marca.toLowerCase() === registro.marca.toLowerCase() &&
    Number(otro.precio) === Number(registro.precio) &&
    otro.estado === registro.estado
  );
}

// idActual sirve al modificar: el producto no se compara contra sí mismo
function validar(registro, idActual) {
  if (!registro.categoria || !registro.producto || !registro.marca || !registro.precio ||
      !registro.stock || !registro.fecha || !registro.estado) {
    return 'Completá todos los campos obligatorios.';
  }
  if (Number(registro.precio) <= 0) return 'El precio debe ser mayor a 0.';
  const stock = Number(registro.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 10000) {
    return 'El stock debe ser un entero entre 0 y 10000.';
  }
  if (new Date(registro.fecha + 'T00:00:00') > new Date()) return 'La fecha de ingreso no puede ser futura.';
  if (esRepetido(registro, idActual)) {
    return 'Ese producto ya está cargado (misma categoría, producto, marca, precio y estado).';
  }
  return '';
}

function guardar(registro, forma) {
  registro.forma = forma;
  if (forma === 'push') registros.push(registro);
  else if (forma === 'unshift') registros.unshift(registro);
  else if (forma === 'splice') registros.splice(Number(inputPosicion.value) - 1, 0, registro);
  else if (forma === 'concat') registros = registros.concat([registro]);
  else registros = [...registros, registro];
}

function botonTabla(texto, clase, accion) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = clase;
  boton.textContent = texto;
  boton.addEventListener('click', accion);
  return boton;
}

function dibujar() {
  cuerpoTabla.innerHTML = '';
  contador.textContent = registros.length;
  actualizarForma();
  if (registros.length === 0) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 11;
    celda.textContent = 'Todavía no hay productos.';
    fila.appendChild(celda);
    cuerpoTabla.appendChild(fila);
    return;
  }
  registros.forEach((r, i) => {
    const fila = document.createElement('tr');
    [i + 1, r.categoria, r.producto, r.marca, '$ ' + r.precio, r.stock, r.fecha, r.estado, r.observaciones || '-', r.forma]
      .forEach(dato => {
        const celda = document.createElement('td');
        celda.textContent = dato;
        fila.appendChild(celda);
      });
    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.appendChild(botonTabla('Modificar', 'btn btn-sec btn-chico-sec', () => abrirEdicion(r)));
    acciones.appendChild(botonTabla('Eliminar', 'btn btn-chico', () => pedirEliminar(r)));
    const celdaAcciones = document.createElement('td');
    celdaAcciones.appendChild(acciones);
    fila.appendChild(celdaAcciones);
    cuerpoTabla.appendChild(fila);
  });
}

// ----- Agregar -----
selectForma.addEventListener('change', actualizarForma);

formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  const registro = leerFormulario(formulario);
  let error = validar(registro, null);
  const forma = selectForma.value;
  if (!error && forma === 'splice') {
    const pos = Number(inputPosicion.value);
    if (!Number.isInteger(pos) || pos < 1 || pos > registros.length + 1) {
      error = 'La posición debe ser un entero entre 1 y ' + (registros.length + 1) + '.';
    }
  }
  if (error) {
    decir('aviso', error, 'error');
    return;
  }
  registro.id = siguienteId++;
  guardar(registro, forma);
  formulario.reset();
  selectForma.value = forma;
  dibujar();
  decir('aviso', 'Producto guardado con ' + forma + '. ' + descripciones[forma].split(': ')[1], 'ok');
});

// ----- Modificar (ventana superpuesta) -----
function abrirEdicion(registro) {
  registroEditando = registro;
  camposProducto.forEach(campo => { formularioEdicion.elements[campo].value = registro[campo]; });
  const avisoModal = document.getElementById('avisoModal');
  avisoModal.textContent = '';
  avisoModal.className = 'aviso';
  fondoEdicion.hidden = false;
}

function cerrarEdicion() {
  fondoEdicion.hidden = true;
  registroEditando = null;
}

formularioEdicion.addEventListener('submit', evento => {
  evento.preventDefault();
  if (!registroEditando) return;
  const nuevos = leerFormulario(formularioEdicion);
  const error = validar(nuevos, registroEditando.id);
  if (error) {
    decir('avisoModal', error, 'error');
    return;
  }
  Object.assign(registroEditando, nuevos); // conserva id y "guardado con"
  dibujar();
  cerrarEdicion();
  decir('aviso', 'Producto modificado correctamente.', 'ok');
});
document.getElementById('botonCancelarEdicion').addEventListener('click', cerrarEdicion);

// ----- Confirmaciones (ventana superpuesta) -----
function pedirConfirmacion(titulo, texto, textoBoton, accion) {
  document.getElementById('tituloConfirmar').textContent = titulo;
  document.getElementById('textoConfirmar').textContent = texto;
  document.getElementById('botonConfirmar').textContent = textoBoton;
  accionPendiente = accion;
  fondoConfirmar.hidden = false;
}

function cerrarConfirmacion() {
  fondoConfirmar.hidden = true;
  accionPendiente = null;
}

function pedirEliminar(registro) {
  pedirConfirmacion(
    'Eliminar producto',
    '¿Seguro que querés eliminar "' + registro.producto + '" (' + registro.marca + ')? Esta acción no se puede deshacer.',
    'Eliminar',
    () => {
      registros.splice(registros.indexOf(registro), 1);
      dibujar();
      decir('aviso', 'Producto eliminado correctamente.', 'ok');
    }
  );
}

document.getElementById('botonVaciar').addEventListener('click', () => {
  if (registros.length === 0) {
    decir('aviso', 'No hay productos para vaciar.', 'error');
    return;
  }
  pedirConfirmacion(
    'Vaciar lista',
    '¿Seguro que querés eliminar los ' + registros.length + ' productos cargados? Esta acción no se puede deshacer.',
    'Vaciar todo',
    () => {
      registros = [];
      dibujar();
      decir('aviso', 'La lista quedó vacía.', 'ok');
    }
  );
});

document.getElementById('botonConfirmar').addEventListener('click', () => {
  const accion = accionPendiente;
  cerrarConfirmacion();
  if (accion) accion();
});
document.getElementById('botonConservar').addEventListener('click', cerrarConfirmacion);

document.addEventListener('keydown', evento => {
  if (evento.key !== 'Escape') return;
  if (!fondoConfirmar.hidden) cerrarConfirmacion();
  else if (!fondoEdicion.hidden) cerrarEdicion();
});

dibujar();
