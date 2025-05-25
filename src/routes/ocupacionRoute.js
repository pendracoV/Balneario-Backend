const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const permit  = require('../middleware/permit');
const ocupacionController = require('../controllers/ocupacionController');

router.get(
  '/',
  auth,
  permit('admin','personal'),
  ocupacionController.getOcupacion
);

module.exports = router;
