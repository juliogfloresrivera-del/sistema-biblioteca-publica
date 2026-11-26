const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const estado = {
    rol: { id_rol: 8, nombre_rol: "CLIENTE" },
    lectorDisponible: true,
    usuarioInsertado: null,
    lectorActualizado: null,
    usuarioEliminado: null
};

class Consulta {
    constructor(tabla) {
        this.tabla = tabla;
        this.operacion = "select";
    }

    select() { return this; }
    eq() { return this; }
    is() { return this; }
    insert(fila) {
        this.operacion = "insert";
        estado.usuarioInsertado = fila;
        return this;
    }
    update(fila) {
        this.operacion = "update";
        if (this.tabla === "lector") estado.lectorActualizado = fila;
        return this;
    }
    delete() {
        this.operacion = "delete";
        return this;
    }
    async maybeSingle() {
        if (this.tabla === "rol") return { data: estado.rol, error: null };
        if (this.tabla === "lector" && this.operacion === "update") {
            return {
                data: estado.lectorDisponible ? { id_lector: 22 } : null,
                error: null
            };
        }
        return { data: null, error: null };
    }
    async single() {
        return { data: { id_usuario: 81 }, error: null };
    }
}

const supabaseAdminPath = require.resolve("../config/supabaseAdmin");
const mockSupabaseAdmin = new Module(supabaseAdminPath);
mockSupabaseAdmin.filename = supabaseAdminPath;
mockSupabaseAdmin.loaded = true;
mockSupabaseAdmin.exports = {
    obtenerSupabaseAdmin: () => ({
        from(tabla) {
            const consulta = new Consulta(tabla);
            const eq = consulta.eq.bind(consulta);
            consulta.eq = (campo, valor) => {
                if (consulta.tabla === "usuario" && consulta.operacion === "delete" && campo === "id_usuario") {
                    estado.usuarioEliminado = valor;
                }
                return eq(campo, valor);
            };
            return consulta;
        }
    })
};
require.cache[supabaseAdminPath] = mockSupabaseAdmin;

const passwordPath = require.resolve("../utils/password");
const mockPassword = new Module(passwordPath);
mockPassword.filename = passwordPath;
mockPassword.loaded = true;
mockPassword.exports = { hashearClave: async () => "hashed-secret" };
require.cache[passwordPath] = mockPassword;

const { crearUsuario } = require("../services/adminUsuariosBibliotecaService");

const datosUsuario = (adicionales = {}) => ({
    nombre_usuario: "lectora",
    clave: "clave-segura-123",
    nombres: "Ana",
    apellido_paterno: "Pérez",
    apellido_materno: "",
    correo: "ana@example.com",
    dni: "12345678",
    id_rol: 8,
    ...adicionales
});

test("creates a client account and links it to the selected reader", async () => {
    estado.lectorDisponible = true;
    estado.usuarioInsertado = null;
    estado.lectorActualizado = null;

    await crearUsuario(datosUsuario({ id_lector: 22 }));

    assert.equal(estado.usuarioInsertado.clave_hash, "hashed-secret");
    assert.equal("id_lector" in estado.usuarioInsertado, false);
    assert.deepEqual(estado.lectorActualizado, { id_usuario: 81 });
});

test("requires a reader before creating a client account", async () => {
    estado.usuarioInsertado = null;

    await assert.rejects(
        crearUsuario(datosUsuario()),
        { message: "Selecciona el socio o lector que se vinculará a esta cuenta." }
    );

    assert.equal(estado.usuarioInsertado, null);
});

test("removes the new account if the selected reader is no longer available", async () => {
    estado.lectorDisponible = false;
    estado.usuarioInsertado = null;
    estado.usuarioEliminado = null;

    await assert.rejects(
        crearUsuario(datosUsuario({ id_lector: 22 })),
        { message: "El socio o lector ya tiene una cuenta vinculada o no está activo." }
    );

    assert.equal(estado.usuarioEliminado, 81);
    estado.lectorDisponible = true;
});
