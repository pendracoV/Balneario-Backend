// src/controllers/turnoController.js
const Turno = require('../models/Turno');

exports.create = async (req, res, next) => {
  try {
    const { personalId, fecha, horarioInicio, horarioFin } = req.body;
    const turno = await Turno.create({
      personal_id:    personalId,
      fecha,
      horario_inicio: horarioInicio,
      horario_fin:    horarioFin
    });
    res.status(201).json(turno);
  } catch (err) {
    next(err);
  }
};
