// server.js (o associations.js)
const sequelize    = require('./config/db');
const User         = require('./models/User');
const Role         = require('./models/Role');
const Reserva      = require('./models/Reserva');
const TipoReserva  = require('./models/TipoReserva');
const Feriado      = require('./models/Feriado');
const Servicio       = require('./models/Servicio');
const ReservaServicio= require('./models/ReservaServicio');


// Definir aquí todas las asociaciones, una vez que Sequelize conoce todos los modelos:

// Usuarios ↔ Roles
User.belongsToMany(Role, {
  through: 'user_roles',
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'Roles'              
});

Role.belongsToMany(User, {
  through: 'user_roles',
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'Users'
});


// Reserva → TipoReserva
// ← Declaración de la relación
Reserva.belongsTo(TipoReserva, {
  foreignKey: 'tipo_reserva_id',
  as: 'tipo'
});

Reserva.belongsToMany(Servicio, {
  through: ReservaServicio,
  foreignKey: 'reserva_id',
  otherKey:   'servicio_id',
  as:        'servicios'
});
Servicio.belongsToMany(Reserva, {
  through: ReservaServicio,
  foreignKey: 'servicio_id',
  otherKey:   'reserva_id',
  as:        'reservas'
});


// Ahora sincronizas y arrancas tu app
sequelize.sync({ alter: true }).then(() => {
  const app = require('./src/app');
  app.listen(process.env.PORT || 3000, () => {
    console.log('Servidor levantado');
  });
});
