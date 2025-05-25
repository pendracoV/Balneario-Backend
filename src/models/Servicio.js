// src/models/Servicio.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Servicio = sequelize.define('Servicio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false   // p.ej. 'cocina', 'cuarto', 'piscina'
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1    // cupos simultáneos
  },
  costo: {                  // añadido para almacenar el precio
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName:   'servicios',
  underscored: true,
  timestamps:  false
});

module.exports = Servicio;
