// src/controllers/reservaController.js
const { Op } = require('sequelize');
const Reserva = require('../models/Reserva');
const TipoReserva = require('../models/TipoReserva');
const Feriado = require('../models/Feriado');

const MIN_PRIVADA_SEMANA = 10;
const PRECIO_PRIVADA_SEMANA = 20000;
const MIN_PRIVADA_FINSEM = 15;
const PRECIO_PRIVADA_FINSEM = 25000;
const CARGO_EXTRA = 100000;
const AFORO_MAX = 120;
const HORARIOS = {
  diurno:   [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  nocturno: [{ start: '18:00', end: '23:00' }]
};

function contarDias(inicio, fin) {
  const d1 = new Date(inicio);
  const d2 = new Date(fin);
  return Math.floor((d2 - d1) / (1000*60*60*24)) + 1;
}

async function esFinDeSemanaOFestivo(fecha) {
  const day = new Date(fecha).getDay();
  if (day === 0 || day === 6) return true;
  return !!await Feriado.findByPk(fecha);
}

// LISTAR reservas
exports.list = async (req, res, next) => {
  try {
    const where = {};
    // si es cliente, solo sus reservas
    if (req.user.Roles.some(r => r.name === 'cliente')) {
      where.cliente_id = req.user.id;
    }
    const reservas = await Reserva.findAll({
      where,
      include: [{ model: TipoReserva, as: 'tipo' }],       // ← asociación incluida
      order: [['fecha_inicio', 'DESC']]
    });
    res.json(reservas);
  } catch (err) {
    next(err);
  }
};

// GET /api/reservas/:id
exports.getById = async (req, res, next) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id, {
      include: [{ model: TipoReserva, as: 'tipo' }]
    });
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

    if (req.user.Roles.some(r => r.name === 'cliente') &&
        reserva.cliente_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    res.json(reserva);
  } catch (err) {
    next(err);
  }
};

// POST /api/reservas
exports.create = async (req, res, next) => {
  try {
    const {
      tipoReservaId,
      fechaInicio, fechaFin,
      horarioInicio, horarioFin,
      personas,
      servicios = [],
      documento: docBody,
      clienteNombre: nombreBody,
      clienteEmail: emailBody
    } = req.body;

    const isPersonal = req.user.Roles.some(r => r.name === 'personal');
    let documento, clienteNombre, clienteEmail;
    if (isPersonal) {
      if (!docBody || !nombreBody || !emailBody) {
        return res.status(400).json({
          message: 'Los usuarios con rol personal deben enviar documento, clienteNombre y clienteEmail'
        });
      }
      documento     = docBody;
      clienteNombre = nombreBody;
      clienteEmail  = emailBody;
    } else {
      documento     = req.user.documento;
      clienteNombre = req.user.nombre;
      clienteEmail  = req.user.email;
    }

    const tipo = await TipoReserva.findByPk(tipoReservaId);
    if (!tipo) return res.status(400).json({ message: 'Tipo de reserva inválido' });

    const validHorario = Object.values(HORARIOS).flat()
      .some(h => h.start === horarioInicio && h.end === horarioFin);
    if (!validHorario) return res.status(400).json({ message: 'Horario inválido' });

    const dias = contarDias(fechaInicio, fechaFin);
    if (personas > AFORO_MAX) {
      return res.status(400).json({ message: 'Excede aforo máximo de 120 personas' });
    }

    const finsem = await esFinDeSemanaOFestivo(fechaInicio);
    let precioPorPersona = 0, cargo = 0;
    if (tipo.nombre === 'privada') {
      if (finsem) {
        precioPorPersona = PRECIO_PRIVADA_FINSEM;
        if (personas < MIN_PRIVADA_FINSEM) cargo = CARGO_EXTRA;
      } else {
        precioPorPersona = PRECIO_PRIVADA_SEMANA;
        if (personas < MIN_PRIVADA_SEMANA) cargo = CARGO_EXTRA;
      }
    }
    const precioBase = precioPorPersona * personas * dias;
    const precioTotal = precioBase + cargo;

    if (tipo.nombre === 'general') {
      const privada = await TipoReserva.findOne({ where: { nombre: 'privada' } });
      const choque = await Reserva.findOne({
        where: {
          tipo_reserva_id: privada.id,
          fecha_inicio: fechaInicio,
          horario_inicio: horarioInicio
        }
      });
      if (choque) {
        return res.status(400).json({
          message: 'Ya existe reserva privada en esa fecha/horario'
        });
      }
    }

    const nueva = await Reserva.create({
      tipo_reserva_id: tipoReservaId,
      fecha_inicio:    fechaInicio,
      fecha_fin:       fechaFin,
      horario_inicio:  horarioInicio,
      horario_fin:     horarioFin,
      personas,
      servicios,
      documento,
      cliente_nombre:  clienteNombre,
      cliente_email:   clienteEmail,
      precio_base:     precioBase,
      cargo_adicional: cargo,
      precio_total:    precioTotal,
      cliente_id:      req.user.id
    });

    // incluye tipo en la respuesta
    const conTipo = await Reserva.findByPk(nueva.id, {
      include: [{ model: TipoReserva, as: 'tipo' }]
    });

    res.status(201).json(conTipo);
  } catch (err) {
    next(err);
  }
};

// PUT /api/reservas/:id
exports.update = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
    reserva.estado = estado;
    await reserva.save();
    const conTipo = await Reserva.findByPk(reserva.id, {
      include: [{ model: TipoReserva, as: 'tipo' }]
    });
    res.json(conTipo);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reservas/:id
exports.remove = async (req, res, next) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
    if (req.user.Roles.some(r => r.name === 'cliente') &&
        reserva.cliente_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    await reserva.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
