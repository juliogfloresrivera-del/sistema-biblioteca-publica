const requireCatalogo = (req, res, next) => {
    const modulos = req.sesion?.modulos;
    if (!Array.isArray(modulos) || !modulos.includes("CATALOGO")) {
        return res.status(403).json({
            success: false,
            message: "No tienes permiso para gestionar el catálogo."
        });
    }

    return next();
};

module.exports = requireCatalogo;
