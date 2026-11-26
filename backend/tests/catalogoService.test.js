const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const operaciones = [];
const supabaseSimulado = {
    from(tabla) {
        return {
            insert(filas) {
                operaciones.push({ tipo: "insert", tabla, filas });
                return Promise.resolve({ error: null });
            },
            update(datos) {
                const operacion = { tipo: "update", tabla, datos };
                operaciones.push(operacion);
                return {
                    async eq(campo, valor) {
                        operacion.filtro = { campo, valor };
                        return { error: null };
                    }
                };
            }
        };
    }
};

const rutaSupabaseAdmin = require.resolve("../config/supabaseAdmin");
const mockSupabaseAdmin = new Module(rutaSupabaseAdmin);
mockSupabaseAdmin.filename = rutaSupabaseAdmin;
mockSupabaseAdmin.loaded = true;
mockSupabaseAdmin.exports = { obtenerSupabaseAdmin: () => supabaseSimulado };
require.cache[rutaSupabaseAdmin] = mockSupabaseAdmin;

const {
    actualizarRegistro,
    crearRegistro,
    darDeBajaRegistro
} = require("../services/catalogoService");

test("creates an allowlisted author and assigns active state on the server", async () => {
    operaciones.length = 0;

    await crearRegistro("autor", {
        nombres: "Mario",
        apellido_paterno: "Vargas",
        apellido_materno: "Llosa"
    });

    assert.deepEqual(operaciones[0], {
        tipo: "insert",
        tabla: "autor",
        filas: [{
            nombres: "Mario",
            apellido_paterno: "Vargas",
            apellido_materno: "Llosa",
            estado: "A"
        }]
    });
});

test("rejects unknown tables and client-supplied state fields", async () => {
    operaciones.length = 0;

    await assert.rejects(crearRegistro("usuario", { nombres: "No autorizado" }), {
        status: 404
    });
    await assert.rejects(crearRegistro("autor", {
        nombres: "Mario",
        apellido_paterno: "Vargas",
        estado: "A"
    }), {
        status: 400
    });

    assert.equal(operaciones.length, 0);
});

test("rejects invalid date values before contacting Supabase", async () => {
    operaciones.length = 0;

    await assert.rejects(crearRegistro("autor", {
        nombres: "Mario",
        apellido_paterno: "Vargas",
        fecha_nacimiento: "2026-02-31"
    }), {
        status: 400
    });

    assert.equal(operaciones.length, 0);
});

test("updates and soft-deletes records using the table primary key", async () => {
    operaciones.length = 0;

    await actualizarRegistro("autor", "12", { nacionalidad: "Peruana" });
    await darDeBajaRegistro("autor", "12");

    assert.deepEqual(operaciones, [
        {
            tipo: "update",
            tabla: "autor",
            datos: { nacionalidad: "Peruana" },
            filtro: { campo: "id_autor", valor: 12 }
        },
        {
            tipo: "update",
            tabla: "autor",
            datos: { estado: "I" },
            filtro: { campo: "id_autor", valor: 12 }
        }
    ]);
});
