const app = require('./src/app');
const sequelize = require('./src/config/db');
// Al principio


// Después configuras tu app...


(async () => {
  // Sincroniza tablas (sin borrarlas)
  await sequelize.sync({ alter: true });
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  });
})();
