const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const consultas = [];
const usuarios = [{ id_usuario: 42, id_rol: 1, estado: "A" }];
const roles = [
    { id_rol: 1, nombre_rol: "ADMINISTRADOR", estado: "A" },
    { id_rol: 2, nombre_rol: "BIBLIOTECARIO", estado: "A" },
    { id_rol: 3, nombre_rol: "INACTIVO", estado: "I" }
];

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
                consulta.filtros.push({ tipo: "eq", campo, valor });
                return this;
            },
            async maybeSingle() {
                if (tabla === "usuario" && consulta.columnas === "id_tipousuario") {
                    return { data: null, error: { code: "42703", message: "column does not exist" } };
                }

                const filas = tabla === "usuario" ? usuarios : roles;
                const fila = filas.find((item) => consulta.filtros.every(
                    (filtro) => String(item[filtro.campo]) === String(filtro.valor)
                ));
                return { data: fila || null, error: null };
            }
        };

        return builder;
    }
};

const rutaSupabase = require.resolve("../config/supabase");
const mockSupabase = new Module(rutaSupabase);
mockSupabase.filename = rutaSupabase;
mockSupabase.loaded = true;
mockSupabase.exports = supabaseSimulado;
require.cache[rutaSupabase] = mockSupabase;

const {
    obtenerPermisosUsuario
} = require("../models/permisosModel");

test("resolves the active library role and its available modules", async () => {
    const resultado = await obtenerPermisosUsuario(42);

    assert.deepEqual(resultado, {
        roles: ["ADMINISTRADOR"],
        modulos: ["CATALOGO", "CIRCULACION", "SOCIOS", "USUARIOS", "REPORTES"]
    });

    assert.ok(consultas.some(
        (consulta) => consulta.tabla === "rol" &&
            consulta.filtros.some((filtro) => filtro.campo === "estado" && filtro.valor === "A")
    ));
});

test("returns the assigned non-admin library role", async () => {
    usuarios[0].id_rol = 2;
    const resultado = await obtenerPermisosUsuario(42);
    assert.equal(resultado.roles[0], "BIBLIOTECARIO");
    assert.ok(resultado.modulos.includes("CATALOGO"));
    usuarios[0].id_rol = 1;
});

test("returns no permissions for an inactive role", async () => {
    usuarios[0].id_rol = 3;
    const resultado = await obtenerPermisosUsuario(42);
    assert.deepEqual(resultado, { roles: [], modulos: [] });
    usuarios[0].id_rol = 1;
});

test("returns no permissions for a user without a role", async () => {
    usuarios[0].id_rol = null;
    assert.deepEqual(await obtenerPermisosUsuario(42), { roles: [], modulos: [] });
    usuarios[0].id_rol = 1;
});
