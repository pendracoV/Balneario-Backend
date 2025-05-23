const { Op } = require('sequelize');
const Inventario = require('../models/Inventario');

exports.list = async (req, res, next) => {
  try {
    const { nombre, minQty, maxQty, desde, hasta } = req.query;
    let where = {};
    if (nombre)   where.nombre = { [Op.iLike]: `%${nombre}%` };
    if (minQty)   where.cantidad = { ...where.cantidad, [Op.gte]: minQty };
    if (maxQty)   where.cantidad = { ...where.cantidad, [Op.lte]: maxQty };
    if (desde)    where.fecha_surtido = { ...where.fecha_surtido, [Op.gte]: desde };
    if (hasta)    where.fecha_surtido = { ...where.fecha_surtido, [Op.lte]: hasta };
    const items = await Inventario.findAll({ where });
    res.json(items);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await Inventario.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Ítem no encontrado' });
    res.json(item);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const newItem = await Inventario.create(req.body);
    res.status(201).json(newItem);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Inventario.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: 'Ítem no encontrado' });
    await item.update(req.body);
    res.json(item);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await Inventario.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Ítem no encontrado' });
    res.status(204).end();
  } catch (err) { next(err); }
};