const User = require('../models/auth.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const getUsers = async () => {
  return await User.findAll();
};

const loginUser = async ({ correo, password }) => {

  const user = await User.findByEmail(correo);

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new Error('Contraseña incorrecta');
  }

  const token = jwt.sign(
    {
      id: user.id_usuario,
      email: user.email,
      rol: user.id_rol
    },
    process.env.JWT_SECRET || 'secreto_dental',
    { expiresIn: '8h' }
  );

  return {
    message: 'Login exitoso',
    token,
    rol: user.id_rol
  };
};

module.exports = {
  getUsers,
  loginUser
};