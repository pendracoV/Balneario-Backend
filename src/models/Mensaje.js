const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

module.exports = sequelize.define('Mensaje', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reservaId:   { type: DataTypes.INTEGER, allowNull: false },
  remitenteId: { type: DataTypes.INTEGER, allowNull: false },
  texto:       { type: DataTypes.TEXT, allowNull: false }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});