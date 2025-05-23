// src/controllers/userController.js
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const User = require('../models/User');
const Role = require('../models/Role');

// GET /api/users       (admin)
exports.list = async (req, res, next) => {
  try {
    // Incluye todos los roles asociados
    const usuarios = await User.findAll({ include: 'Roles' });
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id   (admin)
exports.getById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { include: 'Roles' });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// POST /api/users      (admin)
exports.create = async (req, res, next) => {
  try {
    const { nombre, email, password, roles } = req.body;
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: 'Debes enviar al menos un rol' });
    }

    // 1) Validar que existen todos los roles solicitados
    const roleInstances = await Role.findAll({ where: { name: { [Op.in]: roles } } });
    if (roleInstances.length !== roles.length) {
      return res.status(400).json({ message: 'Algún rol es inválido' });
    }

    // 2) Hashear la contraseña
    const hash = await bcrypt.hash(password, 10);

    // 3) Crear usuario base
    const user = await User.create({
      nombre,
      email,
      password: hash
    });

    // 4) Asignar roles (m2m)
    await user.setRoles(roleInstances);

    // 5) Recuperar para incluir los Roles en la respuesta
    const created = await User.findByPk(user.id, { include: 'Roles' });
    res.status(201).json(created);

  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El correo ya está en uso' });
    }
    next(err);
  }
};

// PUT /api/users/:id   (admin)
exports.update = async (req, res, next) => {
  try {
    const { nombre, email, password, roles } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // 1) Actualizar campos básicos
    if (nombre)   user.nombre   = nombre;
    if (email)    user.email    = email;
    if (password) user.password = await bcrypt.hash(password, 10);

    // 2) Si viene campo roles, re-asignar
    if (roles) {
      if (!Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({ message: 'roles debe ser array no vacío' });
      }
      const roleInstances = await Role.findAll({ where: { name: { [Op.in]: roles } } });
      if (roleInstances.length !== roles.length) {
        return res.status(400).json({ message: 'Algún rol es inválido' });
      }
      await user.setRoles(roleInstances);
    }

    // 3) Guardar cambios en user (si cambió nombre/email/password)
    await user.save();

    // 4) Recuperar actualizado con Roles
    const updated = await User.findByPk(user.id, { include: 'Roles' });
    res.json(updated);

  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El correo ya está en uso' });
    }
    next(err);
  }
};

// DELETE /api/users/:id (admin)
exports.remove = async (req, res, next) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
