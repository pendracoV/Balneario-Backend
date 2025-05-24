const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const reservaController = require('../controllers/reservaController');

// Listar reservas(personal, cliente)
router.get(
  '/',
  auth,
  permit('personal', 'cliente'),
  reservaController.list
);

// Obtener por ID (personal, cliente)
router.get(
  '/:id',
  auth,
  permit('personal', 'cliente'),
  reservaController.getById
);

// Crear reserva (cliente, personal)
router.post(
  '/',
  auth,
  permit('cliente','personal'),
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
  permit('cliente','personal'),
  reservaController.remove
);

module.exports = router;