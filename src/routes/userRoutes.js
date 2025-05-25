const router = require('express').Router();
const auth = require('../middleware/auth');
const permit = require('../middleware/permit');
const { list, create, update, remove , getById } = require('../controllers/userController');


router.use(auth, permit('admin'));
router.get('/', list);        // REQ-3
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
