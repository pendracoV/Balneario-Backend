// src/models/Feriado.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Feriado = sequelize.define('Feriado', {
  fecha:  { type: DataTypes.DATEONLY, primaryKey: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false }
}, {
  tableName:   'feriados',
  underscored: true,
  timestamps:  false
});

module.exports = Feriado;
