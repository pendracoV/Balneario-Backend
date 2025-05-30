if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

require('./models');

const express = require('express');
const path = require('path');
const cors = require('cors'); // <-- Agregado aquí
const sequelize = require('./config/db');

const authRoutes       = require('./routes/authRoutes');
const userRoutes       = require('./routes/userRoutes');
const reservaRoutes    = require('./routes/reservaRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const pagoRoutes       = require('./routes/pagoRoutes');
const mensajeRoutes    = require('./routes/mensajeRoutes');
const ocupacionRoute   = require('./routes/ocupacionRoute');
const turnoRoutes      = require('./routes/turnoRoutes');

const app = express();

// ✅ HABILITAR CORS PARA DESARROLLO Y PRODUCCIÓN
app.use(cors({
  origin: ['http://localhost:5173', 'https://tu-frontend-en-produccion.com'], // Agrega aquí tus orígenes permitidos
  credentials: true,
}));

app.use(express.json());

// Rutas
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/reservas',    reservaRoutes);
app.use('/api/inventarios', inventarioRoutes);
app.use('/api/pagos',       pagoRoutes);
app.use('/api/mensajes',    mensajeRoutes);
app.use('/api/ocupacion',   ocupacionRoute);
app.use('/api/turnos',      turnoRoutes);
app.use('/comprobantes',    express.static(path.join(__dirname, '../comprobantes')));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('🛑 Error interno:', err);    
  res.status(500).json({ 
    message: err.message || 'Error interno del servidor' 
  });
});

module.exports = app;
