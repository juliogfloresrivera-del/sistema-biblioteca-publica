const { esRolCliente } = require("../utils/roles");

const requireCliente = (req, res, next) => {
    const roles = req.sesion?.roles;
    if (!Array.isArray(roles) || roles.length !== 1 || !esRolCliente(roles[0])) {
        return res.status(403).json({
            success: false,
            message: "Esta sección es solo para cuentas de cliente vinculadas a un socio."
        });
    }
    return next();
};

module.exports = requireCliente;
