const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const reservaController = require('../controllers/reservaController');

// Listar reservas
router.get(
  '/',
  auth,
  permit('personal', 'cliente'),
  reservaController.list
);

// Obtener por ID
router.get(
  '/:id',
  auth,
  permit('personal', 'cliente'),
  reservaController.getById
);

// Crear reserva (cliente)
router.post(
  '/',
  auth,
  permit('cliente'),
  reservaController.create
);

// Actualizar estado (personal)
router.put(
  '/:id',
  auth,
  permit('personal'),
  reservaController.update
);

// Cancelar reserva (cliente)
router.delete(
  '/:id',
  auth,
  permit('cliente'),
  reservaController.remove
);

module.exports = router;