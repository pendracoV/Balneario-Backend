// src/models/Pago.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Reserva   = require('./Reserva');

const Pago = sequelize.define('Pago', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  monto: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  reembolso: {
    type: DataTypes.DECIMAL(12,2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName:   'pagos',
  underscored: true,
  timestamps:  false
});

Pago.belongsTo(Reserva, { foreignKey: 'reserva_id', as: 'reserva' });
Reserva.hasMany(Pago, { foreignKey: 'reserva_id', as: 'pagos' });

module.exports = Pago;
