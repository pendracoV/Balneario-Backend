const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Reserva', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha:       { type: DataTypes.DATEONLY, allowNull: false },
  horario:     { type: DataTypes.STRING(20), allowNull: false },
  personas:    { type: DataTypes.INTEGER, allowNull: false },
  notas:       { type: DataTypes.TEXT },
  estado:      { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pendiente' }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});