const express = require("express");

const requireAuth = require("../middleware/requireAuth");
const requireCatalogo = require("../middleware/requireCatalogo");
const { actualizar, crear, darDeBaja } = require("../controllers/catalogoController");

const router = express.Router();

router.use(requireAuth, requireCatalogo);
router.post("/:tabla", crear);
router.put("/:tabla/:id", actualizar);
router.delete("/:tabla/:id", darDeBaja);

module.exports = router;
