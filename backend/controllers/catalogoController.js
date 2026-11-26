const {
    actualizarRegistro,
    crearRegistro,
    darDeBajaRegistro
} = require("../services/catalogoService");

const responderError = (res, error, operacion) => {
    console.error(`Error al ${operacion} registro del catálogo:`, error);
    const status = error.status || 500;
    return res.status(status).json({
        success: false,
        message: error.message || "No se pudo completar la operación del catálogo."
    });
};

const crear = async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        await crearRegistro(req.params.tabla, req.body);
        return res.status(201).json({ success: true, message: "Registro creado correctamente." });
    } catch (error) {
        return responderError(res, error, "crear");
    }
};

const actualizar = async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        await actualizarRegistro(req.params.tabla, req.params.id, req.body);
        return res.status(200).json({ success: true, message: "Registro actualizado correctamente." });
    } catch (error) {
        return responderError(res, error, "actualizar");
    }
};

const darDeBaja = async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
        await darDeBajaRegistro(req.params.tabla, req.params.id);
        return res.status(200).json({ success: true, message: "Registro dado de baja correctamente." });
    } catch (error) {
        return responderError(res, error, "dar de baja");
    }
};

module.exports = { actualizar, crear, darDeBaja };
