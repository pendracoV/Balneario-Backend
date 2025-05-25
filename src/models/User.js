const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Role = require('./Role');

const User = sequelize.define('User', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:   { type: DataTypes.STRING,  allowNull: false },
  email:    { type: DataTypes.STRING,  unique: true, allowNull: false },
  password: { type: DataTypes.STRING,  allowNull: false },
  documento:{ type: DataTypes.STRING,  allowNull: true },   // <— nueva línea
}, {
  underscored: true,
  timestamps: false
});

// Asociación muchos-a-muchos con alias
module.exports = User;
