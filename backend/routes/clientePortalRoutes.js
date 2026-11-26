const express = require("express");

const requireAuth = require("../middleware/requireAuth");
const requireCliente = require("../middleware/requireCliente");
const { catalogo, perfil } = require("../controllers/clientePortalController");

const router = express.Router();

router.use(requireAuth, requireCliente);
router.get("/perfil", perfil);
router.get("/catalogo", catalogo);

module.exports = router;
