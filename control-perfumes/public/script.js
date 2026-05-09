const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de PostgreSQL (usa variable de entorno en Vercel)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Necesario para Supabase
});

// Crear tabla si no existe (al iniciar)
pool.query(`
  CREATE TABLE IF NOT EXISTS perfumes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    marca TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_venta REAL NOT NULL
  )
`);

// ---------- RUTAS API ----------
app.get('/api/perfumes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM perfumes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/perfumes', async (req, res) => {
  const { nombre, marca, cantidad, precio_venta } = req.body;
  if (!nombre || !marca || cantidad === undefined || !precio_venta) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO perfumes (nombre, marca, cantidad, precio_venta) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre, marca, cantidad, precio_venta]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vender/:id', async (req, res) => {
  const id = req.params.id;
  const { cantidad } = req.body;
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }
  try {
    const { rows } = await pool.query('SELECT cantidad FROM perfumes WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    const stockActual = rows[0].cantidad;
    if (stockActual < cantidad) return res.status(400).json({ error: 'Stock insuficiente' });
    const nuevaCantidad = stockActual - cantidad;
    await pool.query('UPDATE perfumes SET cantidad = $1 WHERE id = $2', [nuevaCantidad, id]);
    res.json({ success: true, nuevaCantidad });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/perfumes/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('DELETE FROM perfumes WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solo para desarrollo local, no necesario en Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Servidor local en http://localhost:${PORT}`));
}

// Exportar app para Vercel
module.exports = app;