// src/controllers/ocupacionController.js
const { Op } = require('sequelize');
const Reserva = require('../models/Reserva');

// Definimos los franjas horarias estándar
const HORARIOS = [
  { inicio: '09:00', fin: '12:00' },
  { inicio: '14:00', fin: '18:00' },
  { inicio: '18:00', fin: '23:00' }
];

/**
 * Genera un array de fechas (YYYY-MM-DD) entre startDate y endDate, inclusive.
 */
function generarFechasEntre(startDate, endDate) {
  const fechas = [];
  let current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    fechas.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return fechas;
}

/**
 * GET /api/ocupacion?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Permite al personal autorizado consultar la ocupación (número de personas)
 * para cada fecha y franja horaria en el rango indicado.
 */
exports.getOcupacion = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    // Validación de parámetros
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Debe especificar startDate y endDate en formato YYYY-MM-DD'
      });
    }
    const fechas = generarFechasEntre(startDate, endDate);
    const resultado = [];

    // Para cada fecha y cada franja, sumar las personas reservadas
    for (const fecha of fechas) {
      for (const slot of HORARIOS) {
        const total = await Reserva.sum('personas', {
          where: {
            fecha_inicio:    fecha,
            horario_inicio:  slot.inicio,
            horario_fin:     slot.fin
          }
        }) || 0;

        resultado.push({
          fecha,
          horarioInicio: slot.inicio,
          horarioFin:    slot.fin,
          ocupacion:     total
        });
      }
    }

    res.json(resultado);
  } catch (err) {
    next(err);
  }
};
