const express = require("express");

const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const { descargar } = require("../controllers/adminRespaldosController");

const router = express.Router();

router.use(requireAuth, requireAdmin);
router.get("/", descargar);

module.exports = router;
