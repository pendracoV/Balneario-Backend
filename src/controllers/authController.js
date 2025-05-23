const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Role = require('../models/Role');
const sendEmail = require('../utils/email');
const { Op } = require('sequelize'); 

// REQ-1: Registro
exports.register = async (req, res) => {
  const { nombre, email, password, tipo } = req.body;
  const role = await Role.findOne({ where: { name: tipo } });
  if (!role) return res.status(400).json({ message: 'Tipo de usuario inválido' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ nombre, email, password: hash, roleId: role.id });
  res.status(201).json({ id: user.id, nombre: user.nombre, email: user.email });
};

// Login (genera JWT)
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email }, include: 'Role' });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '8h' });
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
