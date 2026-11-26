const {
    listarCatalogoCliente,
    obtenerPerfilCliente
} = require("../services/clientePortalService");

const responderError = (res, error, operacion) => {
    console.error(`Error al ${operacion} del portal de cliente:`, error);
    return res.status(error.status || 500).json({
        success: false,
        message: error.message || "No se pudo completar la operación del portal de cliente."
    });
};

const perfil = async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        const resultado = await obtenerPerfilCliente(req.sesion.usuario.id_usuario);
        return res.status(200).json({ success: true, perfil: resultado });
    } catch (error) {
        return responderError(res, error, "consultar el perfil");
    }
};

const catalogo = async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        const resultado = await listarCatalogoCliente();
        return res.status(200).json({ success: true, data: resultado });
    } catch (error) {
        return responderError(res, error, "consultar el catálogo");
    }
};

module.exports = { catalogo, perfil };
