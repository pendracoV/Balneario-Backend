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


// PATCH para actualizar solo personas
router.patch(
  '/:id/personas',
  auth,
  permit('admin','personal','cliente'),
  reservaController.updatePersonas  // <-- revisa que este método exista
);

// PATCH para añadir servicios a reserva existente
router.patch(
  '/:id/servicios',
  auth,
  permit('admin','personal','cliente'),
  reservaController.updateServicios // <-- revisa que este método exista
);

module.exports = router;