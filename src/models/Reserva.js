// src/models/Reserva.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const TipoReserva = require('./TipoReserva');  // ← importar

const Reserva = sequelize.define('Reserva', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo_reserva_id:{ type: DataTypes.INTEGER, allowNull: false },
  fecha_inicio:   { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin:      { type: DataTypes.DATEONLY, allowNull: false },
  horario_inicio: { type: DataTypes.TIME,     allowNull: false },
  horario_fin:    { type: DataTypes.TIME,     allowNull: false },
  personas:       { type: DataTypes.INTEGER,  allowNull: false },
  servicios:      { type: DataTypes.JSONB,    allowNull: true },
  documento:      { type: DataTypes.STRING,   allowNull: true },
  cliente_nombre: { type: DataTypes.STRING,   allowNull: true },
  cliente_email:  { type: DataTypes.STRING,   allowNull: true },
  precio_base:    { type: DataTypes.DECIMAL(12,2), allowNull: false },
  cargo_adicional:{ type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  precio_total:   { type: DataTypes.DECIMAL(12,2), allowNull: false },
  estado:         { type: DataTypes.STRING,   allowNull: false, defaultValue: 'Pendiente' },
  cliente_id:     { type: DataTypes.INTEGER,  allowNull: false }
}, {
  tableName:    'reservas',
  underscored:  true,
  timestamps:   true,
  createdAt:    'created_at',
  updatedAt:    'updated_at'
});

// ← Declaración de la relación
Reserva.belongsTo(TipoReserva, {
  foreignKey: 'tipo_reserva_id',
  as: 'tipo'
});

module.exports = Reserva;
