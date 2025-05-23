require('dotenv').config();
const express = require('express');
const sequelize = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pagoRoutes       = require('./routes/pagoRoutes');
const mensajeRoutes    = require('./routes/mensajeRoutes');

const app = express();
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/reservas',    reservaRoutes);
app.use('/api/inventarios', inventarioRoutes);
app.use('/api/pagos',       pagoRoutes);
app.use('/api/mensajes',    mensajeRoutes);
// Manejo de errores
app.use((err, req, res, next) => {
  console.error('🛑 Error interno:', err);    
  res.status(500).json({ 
    message: err.message || 'Error interno del servidor' 
  });
});

module.exports = app;
