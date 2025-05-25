// src/models/TipoReserva.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TipoReserva = sequelize.define('TipoReserva', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:      { type: DataTypes.STRING(50), unique: true, allowNull: false },
  descripcion: { type: DataTypes.TEXT,        allowNull: false }
}, {
  tableName:  'tipo_reserva',
  underscored:true,
  timestamps: false
});

module.exports = TipoReserva;
