// src/routes/pagoRoutes.js
const express        = require('express');
const router         = express.Router();
const auth           = require('../middleware/auth');
const permit         = require('../middleware/permit');
const pagoController = require('../controllers/pagoController');

// Listar pagos
router.get(
  '/',
  auth,
  permit('cliente','personal','admin'),
  pagoController.getPagos
);

// Procesar pago
router.post(
  '/',
  auth,
  permit('cliente','personal','admin'),
  pagoController.createPago
);

// Generar reembolso
router.post(
  '/reembolso/:reservaId',
  auth,
  permit('cliente','personal','admin'),
  pagoController.reembolsar
);

module.exports = router;
