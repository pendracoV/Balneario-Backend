// src/controllers/reservaController.js
const { Op } = require('sequelize');
const Reserva      = require('../models/Reserva');
const TipoReserva  = require('../models/TipoReserva');
const Feriado      = require('../models/Feriado');
const Servicio     = require('../models/Servicio');

const MIN_PRIVADA_SEMANA    = 10;
const PRECIO_PRIVADA_SEMANA = 20000;
const MIN_PRIVADA_FINSEM    = 15;
const PRECIO_PRIVADA_FINSEM = 25000;
const CARGO_EXTRA           = 100000;
const AFORO_MAX             = 120;
const HORARIOS = {
  diurno:   [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  nocturno: [{ start: '18:00', end: '23:00' }]
};

function contarDias(inicio, fin) {
  const d1 = new Date(inicio), d2 = new Date(fin);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
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
    if (req.user.Roles.some(r => r.name === 'cliente')) {
      where.cliente_id = req.user.id;
    }
    const reservas = await Reserva.findAll({
      where,
      include: [
        { model: TipoReserva, as: 'tipo' },
        { model: Servicio,    as: 'servicios' }
      ],
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
      include: [
        { model: TipoReserva, as: 'tipo' },
        { model: Servicio,    as: 'servicios' }
      ]
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
      tipoReservaId, fechaInicio, fechaFin,
      horarioInicio, horarioFin,
      personas, servicios = [],
      documento: docBody,
      clienteNombre: nombreBody,
      clienteEmail: emailBody
    } = req.body;

    // 1) Datos personales según rol...
    const isPersonal = req.user.Roles.some(r => r.name === 'personal');
    let documento, clienteNombre, clienteEmail;
    if (isPersonal) {
      if (!docBody || !nombreBody || !emailBody) {
        return res.status(400).json({ message: 'Usuario personal debe enviar documento, clienteNombre y clienteEmail' });
      }
      documento = docBody; clienteNombre = nombreBody; clienteEmail = emailBody;
    } else {
      documento = req.user.documento;
      clienteNombre = req.user.nombre;
      clienteEmail = req.user.email;
    }

    // 2) Validar tipo y horario...
    const tipo = await TipoReserva.findByPk(tipoReservaId);
    if (!tipo) return res.status(400).json({ message: 'Tipo de reserva inválido' });
    const validHorario = Object.values(HORARIOS).flat()
      .some(h => h.start === horarioInicio && h.end === horarioFin);
    if (!validHorario) return res.status(400).json({ message: 'Horario inválido' });

    // 3) Días y aforo individual...
    const dias = contarDias(fechaInicio, fechaFin);
    if (personas > AFORO_MAX) {
      return res.status(400).json({ message: 'Excede aforo máximo por reserva' });
    }

    // === REQ-26: Validar aforo global ===
    const totalConcurrentes = await Reserva.sum('personas', {
      where: {
        fecha_inicio:   fechaInicio,
        horario_inicio: horarioInicio
      }
    }) || 0;
    if (totalConcurrentes + personas > AFORO_MAX) {
      return res.status(400).json({
        message: `Capacidad máxima de ${AFORO_MAX} personas excedida en ese slot`
      });
    }

    // 4) Cargar servicios y verificar capacidad por servicio...
    const servicioInstances = await Servicio.findAll({ where: { nombre: servicios } });
    const serviciosMap = servicioInstances.reduce((m,s) => (m[s.nombre]=s, m), {});
    for (const nombreServ of servicios) {
      const serv = serviciosMap[nombreServ];
      if (!serv) return res.status(400).json({ message: `Servicio inválido: ${nombreServ}` });
      const usadas = await Reserva.count({
        include: [{ model: Servicio, as: 'servicios', where: { id: serv.id } }],
        where: { fecha_inicio: fechaInicio, horario_inicio: horarioInicio }
      });
      if (usadas >= serv.capacidad) {
        return res.status(400).json({
          message: `El servicio ${nombreServ} no está disponible en ese slot`
        });
      }
    }

    // 5) Calcular precio base y cargo extra...
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
    let precioTotal = precioBase + cargo;

    // 6) Sumar costo de servicios...
    let costoServicios = 0;
    for (const serv of servicioInstances) {
      const mult = serv.nombre === 'cuarto' ? dias : 1;
      costoServicios += serv.costo * mult;
    }
    precioTotal += costoServicios;

    // 7) Bloquear reserva general si existe privada...
    if (tipo.nombre === 'general') {
      const privada = await TipoReserva.findOne({ where: { nombre: 'privada' } });
      const choque = await Reserva.findOne({
        where: {
          tipo_reserva_id: privada.id,
          fecha_inicio:    fechaInicio,
          horario_inicio:  horarioInicio
        }
      });
      if (choque) return res.status(400).json({ message: 'Ya existe privada en ese slot' });
    }
    // 8) Bloquear reserva privada si ya existe otra privada...
    if (tipo.nombre === 'privada') {
      const existePriv = await Reserva.findOne({
        where: {
          tipo_reserva_id: tipo.id,
          fecha_inicio:    fechaInicio,
          horario_inicio:  horarioInicio
        }
      });
      if (existePriv) {
        return res.status(400).json({ message: 'Ya existe otra reserva privada en ese slot' });
      }
    }

    // 10) Crear la reserva
    const nueva = await Reserva.create({
      tipo_reserva_id: tipoReservaId,
      fecha_inicio:    fechaInicio,
      fecha_fin:       fechaFin,
      horario_inicio:  horarioInicio,
      horario_fin:     horarioFin,
      personas,
      documento,
      cliente_nombre:  clienteNombre,
      cliente_email:   clienteEmail,
      precio_base:     precioBase,
      cargo_adicional: cargo,
      precio_total:    precioTotal,
      cliente_id:      req.user.id
    });

    // 10) Asociar servicios (REQ-24 y REQ-25 por primera vez)
    await nueva.addServicios(servicioInstances);

    // 11) Devolver con relaciones
    const conRelaciones = await Reserva.findByPk(nueva.id, {
      include: [
        { model: TipoReserva, as: 'tipo' },
        { model: Servicio,    as: 'servicios' }
      ]
    });
    res.status(201).json(conRelaciones);

  } catch (err) {
    next(err);
  }
};

// PUT /api/reservas/:id  (Actualizar estado)
exports.update = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });
    reserva.estado = estado;
    await reserva.save();
    const conRelaciones = await Reserva.findByPk(reserva.id, {
      include: [
        { model: TipoReserva, as: 'tipo' },
        { model: Servicio,    as: 'servicios' }
      ]
    });
    res.json(conRelaciones);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reservas/:id  (Cancelar reserva)
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


// PATCH /api/reservas/:id/personas  → Actualizar solo personas (ver REQ-26)
exports.updatePersonas = async (req, res, next) => {
  try {
    const { personas } = req.body;
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

    // autorización (cliente solo suya, personal/admin siempre ok)…
    if (req.user.Roles.some(r => r.name==='cliente') &&
        reserva.cliente_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Verificar aforo global para este slot
    const totalConcurrentes = await Reserva.sum('personas', {
      where: {
        fecha_inicio:    reserva.fecha_inicio,
        horario_inicio:  reserva.horario_inicio,
        id:             { [Op.ne]: reserva.id }
      }
    }) || 0;
    if (totalConcurrentes + personas > AFORO_MAX) {
      return res.status(400).json({
        message: `Capacidad de ${AFORO_MAX} personas excedida en ese slot`
      });
    }

    reserva.personas = personas;
    await reserva.save();

    const updated = await Reserva.findByPk(reserva.id, {
      include: [
        { model: TipoReserva, as: 'tipo' },
        { model: Servicio,    as: 'servicios' }
      ]
    });
    res.json(updated);

  } catch (err) {
    next(err);
  }
};

exports.updateServicios = async (req, res, next) => {
  try {
    const { servicios = [] } = req.body;
    const reserva = await Reserva.findByPk(req.params.id, {
      include: [{ model: Servicio, as: 'servicios' }]
    });
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

    // autorización
    if (req.user.Roles.some(r => r.name==='cliente') &&
        reserva.cliente_id !== req.user.id) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    // Cargar nuevas instancias y mapear
    const nuevos = await Servicio.findAll({ where: { nombre: servicios } });
    const mapNuevos = nuevos.reduce((m,s)=> (m[s.nombre]=s,m), {});
    const dias = contarDias(reserva.fecha_inicio, reserva.fecha_fin);

    // Verificar disponibilidad e calcular incremento de costo
    let incremento = 0;
    for (const nombreServ of servicios) {
      const serv = mapNuevos[nombreServ];
      if (!serv) return res.status(400).json({ message: `Servicio inválido: ${nombreServ}` });
      // ya asociado?
      if (reserva.servicios.some(s=>s.id===serv.id)) continue;
      // capacidad
      const usadas = await Reserva.count({
        include:[{ model: Servicio, as:'servicios', where:{id:serv.id} }],
        where: { fecha_inicio: reserva.fecha_inicio, horario_inicio: reserva.horario_inicio }
      });
      if (usadas >= serv.capacidad) {
        return res.status(400).json({ message:`${nombreServ} no disponible en ese slot` });
      }
      // costo
      const mult = serv.nombre==='cuarto'? dias:1;
      incremento += serv.costo*mult;
    }

    // actualizar precio_total
    reserva.precio_total = parseFloat(reserva.precio_total) + incremento;
    await reserva.save();

    // asociar nuevos
    await reserva.addServicios(nuevos);

    // devolver actualizado
    const updated = await Reserva.findByPk(reserva.id, {
      include:[
        { model: TipoReserva, as:'tipo' },
        { model: Servicio,    as:'servicios' }
      ]
    });
    res.json(updated);

  } catch(err) { next(err); }
};
