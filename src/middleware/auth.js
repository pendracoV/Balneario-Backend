const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token faltante' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // <-- Cambiado a 'Roles' en plural
    req.user = await User.findByPk(payload.id, { include: 'Roles' });
    if (!req.user) return res.status(401).json({ message: 'Usuario no encontrado' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
