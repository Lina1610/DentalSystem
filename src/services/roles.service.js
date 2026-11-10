const Role = require('../models/roles.model');

// La autenticación vive únicamente en auth.service.js
const getRoles = async () => {
  return await Role.findAll();
};

module.exports = {
  getRoles,
};
