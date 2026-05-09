const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conectar a SQLite (la base de datos se crea sola en el archivo database.sqlite)
const db = new sqlite3.Database('./database.sqlite');

// Crear tabla si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS perfumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    marca TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_venta REAL NOT NULL
  )
`);

// ---------- RUTAS DE LA API ----------

// Obtener todos los perfumes
app.get('/api/perfumes', (req, res) => {
  db.all('SELECT * FROM perfumes ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Agregar un perfume
app.post('/api/perfumes', (req, res) => {
  const { nombre, marca, cantidad, precio_venta } = req.body;
  if (!nombre || !marca || cantidad === undefined || !precio_venta) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  db.run(
    'INSERT INTO perfumes (nombre, marca, cantidad, precio_venta) VALUES (?, ?, ?, ?)',
    [nombre, marca, cantidad, precio_venta],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Vender perfume (resta cantidad)
app.put('/api/vender/:id', (req, res) => {
  const id = req.params.id;
  const { cantidad } = req.body;
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }
  db.get('SELECT cantidad FROM perfumes WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Perfume no encontrado' });
    if (row.cantidad < cantidad) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }
    const nuevaCantidad = row.cantidad - cantidad;
    db.run('UPDATE perfumes SET cantidad = ? WHERE id = ?', [nuevaCantidad, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, nuevaCantidad });
    });
  });
});

// Eliminar perfume
app.delete('/api/perfumes/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM perfumes WHERE id = ?', id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});