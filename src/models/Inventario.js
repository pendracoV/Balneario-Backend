const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Inventario', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:       { type: DataTypes.STRING(100), allowNull: false },
  cantidad:     { type: DataTypes.INTEGER, allowNull: false },
  descripcion:  { type: DataTypes.TEXT },
  fechaSurtido: { type: DataTypes.DATEONLY }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});