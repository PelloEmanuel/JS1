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

// ===== Proyecto 1: 3 formas de leer un formulario =====
const usuarios = [];
let siguienteId = 1;
const formulario = document.getElementById('formulario');
const formularioEdicion = document.getElementById('formularioEdicion');
const cuerpoTabla = document.getElementById('cuerpoTabla');
const contador = document.getElementById('contador');
const fondoEdicion = document.getElementById('fondoEdicion');
const fondoConfirmar = document.getElementById('fondoConfirmar');
const nombresMetodo = { id: 'Por id', elements: 'Por elements', formdata: 'Por FormData' };
let usuarioEditando = null;
let accionPendiente = null;

// Forma 1: buscar cada campo por su id
function leerPorId() {
  return {
    nombre: document.getElementById('nombre').value.trim(),
    apellido: document.getElementById('apellido').value.trim(),
    correo: document.getElementById('correo').value.trim(),
    edad: document.getElementById('edad').value.trim()
  };
}

// Forma 2: usar la colección "elements" del formulario (por name)
function leerPorElements() {
  const campos = formulario.elements;
  return {
    nombre: campos['nombre'].value.trim(),
    apellido: campos['apellido'].value.trim(),
    correo: campos['correo'].value.trim(),
    edad: campos['edad'].value.trim()
  };
}

// Forma 3: FormData lee todo el formulario de una vez
function leerPorFormData(form) {
  const datos = new FormData(form || formulario);
  return {
    nombre: datos.get('nombre').trim(),
    apellido: datos.get('apellido').trim(),
    correo: datos.get('correo').trim(),
    edad: datos.get('edad').trim()
  };
}

const lectores = { id: leerPorId, elements: leerPorElements, formdata: leerPorFormData };

// idActual sirve al editar: el usuario no se compara contra sí mismo
function validar(usuario, idActual) {
  if (!usuario.nombre || !usuario.apellido || !usuario.correo || !usuario.edad) {
    return 'Completá todos los campos.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.correo)) {
    return 'El correo no tiene un formato válido.';
  }
  // Se compara en minúsculas: Ana@Mail.com y ana@mail.com son el mismo correo
  const correoNuevo = usuario.correo.toLowerCase();
  if (usuarios.some(u => u.id !== idActual && u.correo.toLowerCase() === correoNuevo)) {
    return 'Ya existe un usuario con ese correo.';
  }
  const edad = Number(usuario.edad);
  if (!Number.isInteger(edad) || edad < 1 || edad > 120) {
    return 'La edad debe ser un número entero entre 1 y 120.';
  }
  return '';
}

function botonTabla(texto, clase, accion) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = clase;
  boton.textContent = texto;
  boton.addEventListener('click', accion);
  return boton;
}

// Redibuja la tabla sin recargar la página
function dibujar() {
  cuerpoTabla.innerHTML = '';
  contador.textContent = usuarios.length;
  if (usuarios.length === 0) {
    const fila = document.createElement('tr');
    const celda = document.createElement('td');
    celda.colSpan = 7;
    celda.textContent = 'Todavía no hay usuarios cargados.';
    fila.appendChild(celda);
    cuerpoTabla.appendChild(fila);
    return;
  }
  usuarios.forEach((usuario, i) => {
    const fila = document.createElement('tr');
    [i + 1, usuario.nombre, usuario.apellido, usuario.correo, usuario.edad, nombresMetodo[usuario.metodo]]
      .forEach(dato => {
        const celda = document.createElement('td');
        celda.textContent = dato; // textContent evita inyectar HTML
        fila.appendChild(celda);
      });
    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.appendChild(botonTabla('Editar', 'btn btn-sec btn-chico-sec', () => abrirEdicion(usuario)));
    acciones.appendChild(botonTabla('Eliminar', 'btn btn-chico', () => pedirEliminar(usuario)));
    const celdaAcciones = document.createElement('td');
    celdaAcciones.appendChild(acciones);
    fila.appendChild(celdaAcciones);
    cuerpoTabla.appendChild(fila);
  });
}

// ----- Agregar -----
formulario.addEventListener('submit', evento => {
  evento.preventDefault(); // evita que la página se recargue
  const metodo = document.getElementById('metodo').value;
  const usuario = lectores[metodo]();
  const error = validar(usuario, null);
  if (error) {
    decir('aviso', error, 'error');
    return;
  }
  usuario.id = siguienteId++;
  usuario.metodo = metodo;
  usuarios.push(usuario);
  dibujar();
  formulario.reset();
  document.getElementById('metodo').value = metodo; // mantiene la forma elegida
  decir('aviso', 'Usuario ' + usuario.nombre + ' ' + usuario.apellido + ' agregado (' + nombresMetodo[metodo] + ').', 'ok');
  document.getElementById('nombre').focus();
});

// ----- Editar (ventana superpuesta) -----
function abrirEdicion(usuario) {
  usuarioEditando = usuario;
  ['nombre', 'apellido', 'correo', 'edad'].forEach(campo => {
    formularioEdicion.elements[campo].value = usuario[campo];
  });
  const avisoModal = document.getElementById('avisoModal');
  avisoModal.textContent = '';
  avisoModal.className = 'aviso';
  fondoEdicion.hidden = false;
}

function cerrarEdicion() {
  fondoEdicion.hidden = true;
  usuarioEditando = null;
}

formularioEdicion.addEventListener('submit', evento => {
  evento.preventDefault();
  if (!usuarioEditando) return;
  const nuevos = leerPorFormData(formularioEdicion);
  const error = validar(nuevos, usuarioEditando.id);
  if (error) {
    decir('avisoModal', error, 'error');
    return;
  }
  Object.assign(usuarioEditando, nuevos); // actualiza los datos, conserva id y lectura usada
  const nombre = usuarioEditando.nombre + ' ' + usuarioEditando.apellido;
  dibujar();
  cerrarEdicion();
  decir('aviso', 'Los datos de ' + nombre + ' se actualizaron correctamente.', 'ok');
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

function pedirEliminar(usuario) {
  pedirConfirmacion(
    'Eliminar usuario',
    '¿Seguro que querés eliminar a ' + usuario.nombre + ' ' + usuario.apellido + '? Esta acción no se puede deshacer.',
    'Eliminar',
    () => {
      usuarios.splice(usuarios.indexOf(usuario), 1);
      dibujar();
      decir('aviso', 'Usuario eliminado correctamente.', 'ok');
    }
  );
}

document.getElementById('botonVaciar').addEventListener('click', () => {
  if (usuarios.length === 0) {
    decir('aviso', 'No hay usuarios para vaciar.', 'error');
    return;
  }
  pedirConfirmacion(
    'Vaciar lista',
    '¿Seguro que querés eliminar los ' + usuarios.length + ' usuarios cargados? Esta acción no se puede deshacer.',
    'Vaciar todo',
    () => {
      usuarios.length = 0;
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
