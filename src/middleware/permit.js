// Uso: permit('admin'), permit('personal'), permit('cliente')
module.exports = (...allowedRoles) => (req, res, next) => {
  const userRoles = req.user.Roles.map(r => r.name); // ojo: plural now
  const ok = userRoles.some(r => allowedRoles.includes(r));
  if (!ok) return res.status(403).json({ message: 'Acceso denegado' });
  next();
};
