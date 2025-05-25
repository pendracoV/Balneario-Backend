// src/routes/turnoRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const permit  = require('../middleware/permit');
const turnoController = require('../controllers/turnoController');

router.post(
  '/',
  auth,
  permit('admin','personal'),
  turnoController.create
);

module.exports = router;
