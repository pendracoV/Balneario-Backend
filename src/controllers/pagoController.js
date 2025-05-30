const Reserva = require('../models/Reserva');
const Pago    = require('../models/Pago');
const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const REEMBOLSO_PORC = 0.60; // 60%

// POST /api/pagos
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

    // Enviar email (ajusta tus credenciales SMTP en createTransport)
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
      // No abortamos el flujo; devolvemos la respuesta de todas formas.
    }

    // Responder una única vez
    res.status(201).json({
      pago,
      comprobanteUrl: `/comprobantes/comprobante_${pago.id}.pdf`
    });

  } catch (err) {
    next(err);
  }
};



// GET /api/pagos
// - Cliente: sólo sus pagos
// - Personal/Admin: todos los pagos
exports.getPagos = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    let pagos;

    if (role === 'cliente') {
      // Traer sólo los pagos cuyas reservas son del cliente
      pagos = await Pago.findAll({
        include: [{
          model: Reserva,
          as: 'reserva',
          where: { cliente_id: userId },
          attributes: ['id','cliente_id','fecha_inicio','fecha_fin']
        }]
      });
    } else {
      // personal o admin ven todos
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


// POST /api/pagos/reembolso/:reservaId
// Calcular y registrar reembolso si la cancelación es 6h antes
exports.reembolsar = async (req, res, next) => {
  try {
    const { reservaId } = req.params;
    const reserva = await Reserva.findByPk(reservaId, { include: 'pagos' });
    if (!reserva) return res.status(404).json({ message: 'Reserva no encontrada' });

    const pagoOriginal = reserva.pagos.find(p => p.estado === 'completado');
    if (!pagoOriginal) {
      return res.status(400).json({ message: 'No hay pago completado para esa reserva' });
    }

    // Verificar el plazo de 6 horas...
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

    // **Aquí actualizamos el estado de la reserva**
    reserva.estado = 'Cancelado';
    await reserva.save();

    res.json({ pagoReembolso, reserva });
  } catch (err) {
    next(err);
  }
};
