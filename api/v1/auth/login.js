const { login } = require('../../_lib/desk-session');

module.exports = (req, res) => login(req, res);
