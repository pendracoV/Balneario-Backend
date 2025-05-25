// src/models/index.js
const sequelize     = require('../config/db');
const { DataTypes } = require('sequelize');

// Importa todos los modelos
const User          = require('./User');
const Role          = require('./Role');
const Reserva       = require('./Reserva');
const Servicio      = require('./Servicio');
const TipoReserva   = require('./TipoReserva');
const Feriado       = require('./Feriado');
const ServiciosRes  = require('./ReservaServicio'); // o como lo hayas llamado
// otros modelos...

// Declara asociaciones aquí, una vez que todos los modelos están cargados

// Usuario ↔ Roles
User.belongsToMany(Role, { through: 'user_roles', foreignKey: 'user_id', otherKey: 'role_id', as: 'Roles' });
Role.belongsToMany(User, { through: 'user_roles', foreignKey: 'role_id', otherKey: 'user_id', as: 'Users' });

// Reserva → TipoReserva
Reserva.belongsTo(TipoReserva, { foreignKey: 'tipo_reserva_id', as: 'tipo' });

// Reserva ↔ Servicio
Reserva.belongsToMany(Servicio, {
  through: 'reserva_servicios',
  foreignKey: 'reserva_id',
  otherKey: 'servicio_id',
  as: 'servicios'
});
Servicio.belongsToMany(Reserva, {
  through: 'reserva_servicios',
  foreignKey: 'servicio_id',
  otherKey: 'reserva_id',
  as: 'reservas'
});

// ReservaServicio es tabla intermedia, no necesita más associations

module.exports = {
  sequelize,
  User,
  Role,
  Reserva,
  Servicio,
  TipoReserva,
  Feriado,
  ReservaServicio: ServiciosRes
};
