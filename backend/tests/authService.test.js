const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { hashearClave } = require("../utils/password");
const { verificarClave } = require("../utils/password");
const hashCredencial = hashearClave("clave-segura-123");
let usarClaveHeredada = false;

const usuarioModelo = {
    buscarUsuarioPorLogeo: async () => usarClaveHeredada
        ? {
            id_usuario: 9,
            id_tipousuario: 1,
            id_empleado: 3,
            logeo: "recepcion",
            clave: "clave-heredada",
            clave_hash: null,
            credencialDisponible: false,
            estado: "1"
        }
        : {
            id_usuario: 9,
            id_tipousuario: 1,
            id_empleado: 3,
            logeo: "recepcion",
            clave: "",
            clave_hash: await hashCredencial,
            estado: "1"
        },
    verificarCredencialUsuario: async (usuario, clave) =>
        usuario?.clave_hash ? verificarClave(clave, usuario.clave_hash) : false
};

const rutaUsuario = require.resolve("../models/usuarioModel");
const rutaPermisos = require.resolve("../models/permisosModel");
const mockUsuario = new Module(rutaUsuario);
mockUsuario.filename = rutaUsuario;
mockUsuario.loaded = true;
mockUsuario.exports = usuarioModelo;
require.cache[rutaUsuario] = mockUsuario;

const mockPermisos = new Module(rutaPermisos);
mockPermisos.filename = rutaPermisos;
mockPermisos.loaded = true;
mockPermisos.exports = {
    obtenerPermisosUsuario: async () => ({
        roles: ["BIBLIOTECARIO"],
        modulos: ["CATALOGO", "CIRCULACION", "SOCIOS", "USUARIOS", "REPORTES"]
    })
};
require.cache[rutaPermisos] = mockPermisos;

const { autenticarUsuario } = require("../services/authService");

test("authenticates staff accounts using the stored password hash", async () => {
    const resultado = await autenticarUsuario("recepcion", "clave-segura-123");

    assert.equal(resultado.success, true);
    assert.deepEqual(resultado.roles, ["BIBLIOTECARIO"]);
    assert.ok(resultado.token);
});

test("rejects passwords that do not match the stored hash", async () => {
    const resultado = await autenticarUsuario("recepcion", "clave-incorrecta");

    assert.equal(resultado.success, false);
    assert.equal(resultado.message, "El usuario o la contraseña son incorrectos.");
});

test("rejects a legacy plain-text password", async () => {
    usarClaveHeredada = true;

    try {
        const resultado = await autenticarUsuario("recepcion", "clave-heredada");

        assert.equal(resultado.success, false);
    } finally {
        usarClaveHeredada = false;
    }
});
