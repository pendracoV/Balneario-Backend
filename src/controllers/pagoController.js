const Pago = require('../models/Pago');

exports.list = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.Role.name === 'cliente') where.cliente_id = req.user.id;
    const pagos = await Pago.findAll({ where });
    res.json(pagos);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const pago = await Pago.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ message: 'Pago no encontrado' });
    if (req.user.Role.name === 'cliente' && pago.cliente_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    res.json(pago);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { reservaId, monto, metodo } = req.body;
    const pago = await Pago.create({ reservaId, cliente_id: req.user.id, monto, metodo });
    res.status(201).json(pago);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const pago = await Pago.findByPk(req.params.id);
    if (!pago) return res.status(404).json({ message: 'Pago no encontrado' });
    pago.estado = req.body.estado;
    await pago.save();
    res.json(pago);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Pago.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Pago no encontrado' });
    res.status(204).end();
  } catch (err) { next(err); }
};