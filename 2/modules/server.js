// Servidor Express simple: solo expone lo que el navegador necesita
const express = require('express');
const path = require('path');

const app = express();
const PUERTO = 3000;
const raiz = path.join(__dirname, '..');

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(raiz, 'pages', 'index.html'));
});

// Carpetas estáticas
app.use('/styles', express.static(path.join(raiz, 'styles')));
app.use('/data', express.static(path.join(raiz, 'data')));

// Solo el script del navegador (nunca server.js)
app.get('/modules/script.js', (req, res) => {
  res.sendFile(path.join(raiz, 'modules', 'script.js'));
});

app.listen(PUERTO, () => {
  console.log('Servidor listo en http://localhost:' + PUERTO);
});
