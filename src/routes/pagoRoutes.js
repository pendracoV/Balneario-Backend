const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const permit  = require('../middleware/permit');
const pagoController = require('../controllers/pagoController');

// Procesar pago al crear reserva (REQ-32, REQ-34)
router.post(
  '/',
  auth,
  permit('cliente','personal','admin'),
  pagoController.createPago
);

// Generar reembolso (REQ-33)
router.post(
  '/reembolso/:reservaId',
  auth,
  permit('cliente','personal','admin'),
  pagoController.reembolsar
);

module.exports = router;
