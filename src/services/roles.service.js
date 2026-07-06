const Role = require('../models/roles.model');

const getRoles = async () => {
  return await Role.findAll();
};

const login = async ({ correo, password }) => {

  const user = await Role.findByEmail(correo);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  if (user.password !== password) {
    throw new Error('Contraseña incorrecta');
  }

  return user;
};

module.exports = {
  getRoles,
  login
};