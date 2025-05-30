const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const sendEmail = require('../utils/email');
const { Op } = require('sequelize'); 

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password, tipo, documento } = req.body;
    if (!documento) {
      return res.status(400).json({ message: 'Debes enviar tu documento' });
    }

    // 1) Validar rol
    const role = await Role.findOne({ where: { name: tipo } });
    if (!role) {
      return res.status(400).json({ message: 'Tipo de usuario inválido' });
    }

    // 2) Hashear la contraseña
    const hash = await bcrypt.hash(password, 10);

    // 3) Crear usuario base
    const user = await User.create({ nombre, email, password: hash, documento });

    // 4) Asignar rol en la tabla intermedia user_roles
    await user.setRoles([role]);

    // 5) Recuperar usuario con sus roles para la respuesta
    const created = await User.findByPk(user.id, { include: 'Roles' });

    // 6) (Opcional) Enviar email de confirmación...
    // await sendEmail(email, 'Bienvenido', 'Gracias por registrarte');

    res.status(201).json(created);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El correo ya está en uso' });
    }
    next(err);
  }
};

// Login (genera JWT)
// src/controllers/authController.js

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ 
    where: { email },
    include: 'Roles'    // ya lo tenías
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  // Extraemos el nombre del rol (asumiendo que cada usuario tiene exactamente un rol)
  const role = user.Roles.length
    ? user.Roles[0].name
    : 'cliente';

  // Firmamos el token incluyendo id y rol
  const token = jwt.sign(
    { id: user.id, role }, 
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token });
};


// REQ-7: Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: 'Email no registrado' });

  user.resetToken = crypto.randomBytes(32).toString('hex');
  user.resetTokenExpiry = Date.now() + 3600_000; // 1h
  await user.save();

  const link = `${process.env.FRONT_URL}/reset-password/${user.resetToken}`;
  await sendEmail(user.email, 'Recupera tu contraseña', `Hola ${user.nombre}, usa este enlace: ${link}`);
  res.json({ message: 'Email de recuperación enviado' });
};

// REQ-7: Cambiar contraseña
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, nuevaPassword } = req.body;

    // Busca usuario cuyo token coincida y no haya expirado
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Actualiza la contraseña
    user.password = await bcrypt.hash(nuevaPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};
