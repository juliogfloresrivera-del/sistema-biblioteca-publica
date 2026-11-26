const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const bcrypt = require("bcryptjs");
const { hashearClave } = require("../utils/password");

const respuestas = [];
const consultas = [];
const supabaseSimulado = {
    from(tabla) {
        const consulta = { tabla, columnas: "", filtros: [] };
        consultas.push(consulta);
        const builder = {
            select(columnas) {
                consulta.columnas = columnas;
                return this;
            },
            eq(campo, valor) {
                consulta.filtros.push([campo, valor]);
                return this;
            },
            maybeSingle: async () => respuestas.shift()
        };
        return builder;
    }
};

const rutaSupabaseAdmin = require.resolve("../config/supabaseAdmin");
const mockSupabaseAdmin = new Module(rutaSupabaseAdmin);
mockSupabaseAdmin.filename = rutaSupabaseAdmin;
mockSupabaseAdmin.loaded = true;
mockSupabaseAdmin.exports = {
    obtenerSupabaseAdmin: () => supabaseSimulado
};
require.cache[rutaSupabaseAdmin] = mockSupabaseAdmin;

const {
    buscarUsuarioActivoPorId,
    buscarUsuarioPorLogeo,
    verificarCredencialUsuario
} = require("../models/usuarioModel");

test("recognizes active accounts using supported status values", async () => {
    respuestas.push({ data: { id_usuario: 9 }, error: null });
    assert.equal(await buscarUsuarioActivoPorId(9), true);
    assert.deepEqual(consultas.at(-1).filtros, [
        ["id_usuario", 9],
        ["estado", "A"]
    ]);

    respuestas.push({ data: null, error: null });
    respuestas.push({ data: { id_usuario: 9 }, error: null });
    assert.equal(await buscarUsuarioActivoPorId(9), true);
    assert.deepEqual(consultas.at(-1).filtros, [
        ["id_usuario", 9],
        ["estado", "1"]
    ]);

    respuestas.push({ data: null, error: null });
    respuestas.push({ data: null, error: null });
    assert.equal(await buscarUsuarioActivoPorId(9), false);
});

test("looks up users by username using the library account schema", async () => {
    const usuario = {
        id_usuario: 9,
        nombre_usuario: "bibliotecaria",
        clave_hash: "scrypt$...",
        nombres: "Ana",
        estado: "A"
    };
    respuestas.push({ data: usuario, error: null });

    assert.deepEqual(await buscarUsuarioPorLogeo("bibliotecaria"), {
        ...usuario,
        correo: "bibliotecaria",
        apellido_paterno: "",
        bloqueado: false,
        intentos_fallidos: 0
    });
    assert.equal(consultas.at(-1).columnas, "id_usuario,nombre_usuario,clave_hash,nombres,apellido_paterno,correo,estado,id_rol,bloqueado,intentos_fallidos");
    assert.deepEqual(consultas.at(-1).filtros, [["nombre_usuario", "bibliotecaria"]]);
});

test("looks up users by email and falls back to the username column", async () => {
    respuestas.push({
        data: null, error: null
    });
    respuestas.push({
        data: { id_usuario: 9, nombre_usuario: "bibliotecaria", estado: "A" },
        error: null
    });

    const usuario = await buscarUsuarioPorLogeo("user@example.com");
    assert.equal(usuario.nombre_usuario, "bibliotecaria");
    assert.equal(consultas.at(-2).filtros[0][0], "correo");
    assert.equal(consultas.at(-2).filtros[0][1], "user@example.com");
    assert.deepEqual(consultas.at(-1).filtros, [["nombre_usuario", "user@example.com"]]);
});

test("verifies scrypt and bcrypt credentials and rejects plain text", async () => {
    const hash = await hashearClave("clave-segura-123");
    const bcryptHash = await bcrypt.hash("clave-bcrypt-123", 10);
    assert.equal(await verificarCredencialUsuario({ clave_hash: hash }, "clave-segura-123"), true);
    assert.equal(await verificarCredencialUsuario({ clave_hash: hash }, "incorrecta"), false);
    assert.equal(
        await verificarCredencialUsuario({ clave_hash: bcryptHash }, "clave-bcrypt-123"),
        true
    );
    assert.equal(
        await verificarCredencialUsuario({ clave_hash: bcryptHash }, "incorrecta"),
        false
    );
    assert.equal(
        await verificarCredencialUsuario({ clave_hash: "plain-text" }, "plain-text"),
        false
    );
});

test("does not hide Supabase lookup errors", async () => {
    respuestas.push({
        data: null,
        error: { code: "42501", message: "permission denied" }
    });

    await assert.rejects(
        buscarUsuarioPorLogeo("bibliotecaria"),
        (error) => error?.code === "42501" && error.message === "permission denied"
    );
});
