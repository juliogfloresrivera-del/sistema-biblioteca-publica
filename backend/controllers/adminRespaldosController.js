const { crearRespaldo } = require("../services/adminRespaldosService");

const descargar = async (req, res) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");

    try {
        const respaldo = await crearRespaldo(req.sesion.usuario.id_usuario);
        const fechaArchivo = respaldo.metadata.generadoEn.replace(/[:.]/g, "-");

        return res
            .status(200)
            .type("application/json")
            .attachment(`respaldo-hotel-sol-ica-${fechaArchivo}.json`)
            .send(JSON.stringify(respaldo, null, 2));
    } catch (error) {
        console.error("No se pudo generar el respaldo del sistema:", error);
        return res.status(error.status || 500).json({
            success: false,
            message: error.status === 503
                ? error.message
                : "No se pudo generar el respaldo del sistema."
        });
    }
};

module.exports = { descargar };
