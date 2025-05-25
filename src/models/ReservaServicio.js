// src/models/ReservaServicio.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ReservaServicio = sequelize.define('ReservaServicio', {
  reserva_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  servicio_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  }
}, {
  tableName:   'reserva_servicios',
  underscored: true,
  timestamps:  false
});

module.exports = ReservaServicio;
