const Mensaje = require('../models/Mensaje');

exports.list = async (req, res, next) => {
  try {
    const { reservaId } = req.query;
    const where = { reserva_id: reservaId };
    const mensajes = await Mensaje.findAll({ where, order: [['created_at','ASC']] });
    res.json(mensajes);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { reservaId, texto } = req.body;
    const msg = await Mensaje.create({ reserva_id: reservaId, remitente_id: req.user.id, texto });
    res.status(201).json(msg);
  } catch (err) { next(err); }
};