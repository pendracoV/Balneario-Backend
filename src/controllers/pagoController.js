// src/controllers/pagoController.js

const Reserva       = require('../models/Reserva');
const Pago          = require('../models/Pago');
const PDFDocument   = require('pdfkit');
const fs            = require('fs');
const path          = require('path');
const nodemailer    = require('nodemailer');

const REEMBOLSO_PORC = 0.60; // 60%

// GET /api/pagos
// - Cliente: sólo sus propios pagos
// - Personal/Admin: todos los pagos
exports.getPagos = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let pagos;

    if (role === 'cliente') {
      pagos = await Pago.findAll({
        include: [{
          model: Reserva,
          as: 'reserva',
          where: { cliente_id: userId },
          attributes: ['id','cliente_id','fecha_inicio','fecha_fin']
        }]
      });
    } else {
      pagos = await Pago.findAll({
        include: [{
          model: Reserva,
          as: 'reserva',
          attributes: ['id','cliente_id','fecha_inicio','fecha_fin']
        }]
      });
    }

    res.json(pagos);
  } catch (err) {
    next(err);
  }
};

// POST /api/pagos
// Crea un pago y marca la reserva como confirmada
exports.createPago = async (req, res, next) => {
  try {
    const { reservaId, metodo_pago } = req.body;

    // REQ-32: sólo transferencia
    if (metodo_pago !== 'transferencia') {
      return res.status(400).json({ message: 'Sólo se acepta método transferencia' });
    }

    const reserva = await Reserva.findByPk(reservaId);
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

    // El monto a pagar es el precio_total
    const monto = reserva.precio_total;

    // Crear registro de pago
    const pago = await Pago.create({
      reserva_id:  reservaId,
      monto,
      metodo_pago,
      estado:      'completado'
    });

    // Marcar la reserva como confirmada
    reserva.estado = 'confirmada';
    await reserva.save();

    // Preparar ruta del comprobante
    const filePath = path.join(__dirname, `../../comprobantes/comprobante_${pago.id}.pdf`);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Generar PDF
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(20).text('Comprobante de Pago', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12)
      .text(`ID Pago: ${pago.id}`)
      .text(`Reserva ID: ${reservaId}`)
      .text(`Monto: $${pago.monto}`)
      .text(`Método: ${pago.metodo_pago}`)
      .text(`Fecha: ${pago.fecha_pago.toISOString()}`)
      .text(`Estado: ${pago.estado}`);
    doc.end();

    // Enviar email (configura tus credenciales SMTP aquí)
    const transporter = nodemailer.createTransport({ /* datos SMTP */ });
    try {
      await transporter.sendMail({
        from: '"Balneario" <no-reply@balneario.com>',
        to: reserva.cliente_email,
        subject: 'Comprobante de Pago y Confirmación de Reserva',
        text: 'Adjunto tu comprobante en PDF. ¡Gracias por tu reserva!',
        attachments: [{ filename: `comprobante_${pago.id}.pdf`, path: filePath }]
      });
    } catch (mailErr) {
      console.error('Error enviando email:', mailErr);
      // No interrumpimos el flujo
    }

    // Responder
    res.status(201).json({
      pago,
      comprobanteUrl: `/comprobantes/comprobante_${pago.id}.pdf`
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/pagos/reembolso/:reservaId
// Genera un reembolso si la cancelación es con al menos 6h de antelación
exports.reembolsar = async (req, res, next) => {
  try {
    const { reservaId } = req.params;
    const reserva = await Reserva.findByPk(reservaId, { include: 'pagos' });
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

    const pagoOriginal = reserva.pagos.find(p => p.estado === 'completado');
    if (!pagoOriginal) {
      return res.status(400).json({ message: 'No hay pago completado para esa reserva' });
    }

    // Verificar plazo de 6 horas
    const now = new Date();
    const inicio = new Date(`${reserva.fecha_inicio}T${reserva.horario_inicio}`);
    const diffH = (inicio - now) / (1000 * 60 * 60);
    if (diffH < 6) {
      return res.status(400).json({ message: 'No aplica reembolso (menos de 6 horas)' });
    }

    // Calcular reembolso
    const reembolso = parseFloat(pagoOriginal.monto) * REEMBOLSO_PORC;

    // Crear registro de reembolso
    const pagoReembolso = await Pago.create({
      reserva_id:  reservaId,
      monto:      -reembolso,
      metodo_pago:'transferencia',
      estado:     'reembolsado',
      reembolso
    });

    // Actualizar estado de la reserva a cancelada
    reserva.estado = 'cancelada';
    await reserva.save();

    res.json({ pagoReembolso, reserva });
  } catch (err) {
    next(err);
  }
};
