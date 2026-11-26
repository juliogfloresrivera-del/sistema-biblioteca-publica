const {
    buscarUsuarioPorLogeo,
    verificarCredencialUsuario
} = require("../models/usuarioModel");
const { obtenerPermisosUsuario } = require("../models/permisosModel");
const { crearTokenSesion } = require("../utils/sessionToken");

const autenticarUsuario = async (logeo, clave) => {

    const usuario = await buscarUsuarioPorLogeo(logeo);

    if (!usuario) {
        return {
            success: false,
            message: "El usuario o la contraseña son incorrectos."
        };
    }

    if (!["A", "1"].includes(String(usuario.estado).toUpperCase())) {
        return {
            success: false,
            message: "El usuario se encuentra inactivo."
        };
    }

    if (usuario.bloqueado) {
        return {
            success: false,
            message: "La cuenta se encuentra bloqueada. Contacta al administrador."
        };
    }

    const claveValida = await verificarCredencialUsuario(usuario, clave);
    if (!claveValida) {
        return {
            success: false,
            message: "El usuario o la contraseña son incorrectos."
        };
    }

    const permisos = await obtenerPermisosUsuario(usuario.id_usuario);
    const datosUsuario = {
        id_usuario: usuario.id_usuario,
        nombre_usuario: usuario.nombre_usuario,
        nombres: usuario.nombres,
        apellido_paterno: usuario.apellido_paterno,
        correo: usuario.correo,
        estado: usuario.estado
    };
    const sesion = crearTokenSesion({
        usuario: datosUsuario,
        ...permisos
    });

    return {
        success: true,
        usuario: datosUsuario,
        roles: permisos.roles,
        modulos: permisos.modulos,
        token: sesion.token,
        expiraEn: sesion.expiraEn
    };
};

module.exports = {
    autenticarUsuario
};