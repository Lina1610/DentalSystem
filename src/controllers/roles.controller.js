const rolesService = require('../services/roles.service');

const getRoles = async (req, res) => {
  try {
    const roles = await rolesService.getRoles();
    res.json(roles);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const result = await rolesService.login(req.body);

    res.json(result);

  } catch (error) {
    res.status(401).json({
      message: error.message
    });
  }
};

module.exports = {
  getRoles,
  login
};