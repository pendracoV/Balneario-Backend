const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Pago', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reservaId:  { type: DataTypes.INTEGER, allowNull: false },
  clienteId:  { type: DataTypes.INTEGER, allowNull: false },
  monto:      { type: DataTypes.DECIMAL(10,2), allowNull: false },
  metodo:     { type: DataTypes.STRING(50), allowNull: false },
  estado:     { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pendiente' }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});