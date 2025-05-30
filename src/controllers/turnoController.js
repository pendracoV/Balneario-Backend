// src/controllers/turnoController.js
const Turno = require('../models/Turno')

exports.create = async (req, res, next) => {
  try {
    const { personalId, fecha } = req.body
    if (!personalId || !fecha) {
      return res.status(400).json({ message: 'Debe enviar personalId y fecha' })
    }

    const bloques = [
      { horario_inicio: '09:00:00', horario_fin: '12:00:00' },
      { horario_inicio: '14:00:00', horario_fin: '18:00:00' },
      { horario_inicio: '18:00:00', horario_fin: '23:00:00' }
    ]

    const turnos = await Promise.all(
      bloques.map(b =>
        Turno.create({
          personal_id: personalId,
          fecha,
          horario_inicio: b.horario_inicio,
          horario_fin: b.horario_fin
        })
      )
    )

    res.status(201).json(turnos)
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: err.errors.map(e => e.message).join('; ')
      })
    }
    next(err)
  }
}
