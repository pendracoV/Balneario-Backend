const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User      = require('./User');

const Turno = sequelize.define('Turno', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
  },
  personal_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  horario_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  horario_fin: {
    type: DataTypes.TIME,
    allowNull: false
  }
}, {
  tableName:   'turnos',
  underscored: true,
  timestamps:  false
});

// Asociación
Turno.belongsTo(User, { foreignKey: 'personal_id', as: 'personal' });
User.hasMany(Turno, { foreignKey: 'personal_id', as: 'turnos' });

module.exports = Turno;
