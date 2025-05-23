const { Op } = require('sequelize');
const Reserva = require('../models/Reserva');

// Lista reservas (personal ve todas, cliente solo las suyas)
exports.list = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.Role.name === 'cliente') {
      where.cliente_id = req.user.id;
    }
    const reservas = await Reserva.findAll({ where, order: [['fecha', 'DESC']] });
    res.json(reservas);
  } catch (err) {
    next(err);
  }
};

// Obtener reserva por ID
exports.getById = async (req, res, next) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
    // Si es cliente, verificar propiedad
    if (req.user.Role.name === 'cliente' && reserva.cliente_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

// Crear reserva (solo cliente)
exports.create = async (req, res, next) => {
  try {
    const { fecha, horario, personas, notas } = req.body;
    const nueva = await Reserva.create({
      fecha,
      horario,
      personas,
      notas,
      cliente_id: req.user.id
    });
    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
};

// Actualizar estado (solo personal)
exports.update = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
    reserva.estado = estado;
    await reserva.save();
    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

// Cancelar reserva (cliente)
exports.remove = async (req, res, next) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
    if (req.user.Role.name === 'cliente' && reserva.cliente_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    await reserva.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};