const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const ctrl = require('../controllers/pagoController');

router.use(auth);
router.get('/',    permit('personal','cliente'), ctrl.list);
router.get('/:id', permit('personal','cliente'), ctrl.getById);
router.post('/',   permit('cliente'),            ctrl.create);
router.put('/:id', permit('personal'),           ctrl.update);
router.delete('/:id', permit('personal'),        ctrl.remove);
module.exports = router;