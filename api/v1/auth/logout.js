const { logout } = require('../../_lib/desk-session');

module.exports = (req, res) => logout(req, res);
