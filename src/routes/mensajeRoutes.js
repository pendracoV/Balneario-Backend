const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const ctrl = require('../controllers/mensajeController');

router.use(auth, permit('personal','cliente'));
router.get('/',  ctrl.list);
router.post('/', ctrl.create);
module.exports = router;