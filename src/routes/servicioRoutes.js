// src/routes/servicioRoutes.js
router.get('/:reservaId', auth, async (req, res, next) => {
  const reserva = await Reserva.findByPk(req.params.reservaId);
  if (!reserva) return res.status(404).end();
  // Solo admin, personal o el cliente de esa reserva pueden ver
  const isAllowed =
    req.user.Roles.some(r => ['admin','personal'].includes(r.name)) ||
    reserva.cliente_id === req.user.id;
  if (!isAllowed) return res.status(403).json({ message: 'Acceso denegado' });
  const servicios = await reserva.getServicios();
  res.json(servicios);
});
