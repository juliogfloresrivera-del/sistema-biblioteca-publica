const test = require("node:test");
const assert = require("node:assert/strict");

let filasPorTabla;
let errorTabla;
const consultas = [];
const clienteSimulado = {
    from(nombre) {
        return {
            select() { return this; },
            order(clavePrimaria, opciones) {
                this.clavePrimaria = clavePrimaria;
                this.opciones = opciones;
                return this;
            },
            range(desde, hasta) {
                consultas.push({
                    nombre,
                    clavePrimaria: this.clavePrimaria,
                    ordenAscendente: this.opciones.ascending,
                    desde,
                    hasta
                });
                if (errorTabla === nombre) {
                    return Promise.resolve({
                        data: null,
                        error: { message: "consulta fallida" }
                    });
                }

                const filas = filasPorTabla[nombre] || [];
                return Promise.resolve({
                    data: filas.slice(desde, hasta + 1),
                    error: null
                });
            }
        };
    }
};

const rutaSupabaseAdmin = require.resolve("../config/supabaseAdmin");
require.cache[rutaSupabaseAdmin] = {
    exports: { obtenerSupabaseAdmin: () => clienteSimulado }
};

const {
    crearRespaldo,
    FILAS_POR_PAGINA,
    TABLAS_RESPALDO
} = require("../services/adminRespaldosService");

test("exports every configured table including inactive rows and handles pagination", async () => {
    filasPorTabla = {
        persona: Array.from({ length: FILAS_POR_PAGINA + 1 }, (_, id) => ({ id_persona: id + 1 })),
        usuario: [{ id_usuario: 1, clave: "clave-heredada" }]
    };
    errorTabla = null;
    consultas.length = 0;

    const respaldo = await crearRespaldo(7);

    assert.equal(respaldo.metadata.formato, "hotel-sol-ica-backup");
    assert.equal(respaldo.metadata.generadoPor, 7);
    assert.equal(respaldo.tablas.persona.length, FILAS_POR_PAGINA + 1);
    assert.deepEqual(respaldo.metadata.camposOmitidos, { usuario: ["clave"] });
    assert.equal(respaldo.tablas.usuario[0].clave, "");
    assert.deepEqual(respaldo.tablas.usuario_credencial, []);
    assert.deepEqual(Object.keys(respaldo.tablas), TABLAS_RESPALDO.map(({ nombre }) => nombre));
    assert.equal(
        TABLAS_RESPALDO.find(({ nombre }) => nombre === "detalle_venta").clavePrimaria,
        "id_detalle"
    );
    assert.equal(
        TABLAS_RESPALDO.find(({ nombre }) => nombre === "movimiento_caja").clavePrimaria,
        "id_movimientocaja"
    );
    assert.deepEqual(
        consultas.filter(({ nombre }) => nombre === "persona").map(({ desde }) => desde),
        [0, FILAS_POR_PAGINA]
    );
    assert.ok(consultas.every(({ clavePrimaria, ordenAscendente }) =>
        Boolean(clavePrimaria) && ordenAscendente
    ));
    assert.ok(consultas.every(({ desde, hasta }) =>
        hasta - desde === FILAS_POR_PAGINA - 1
    ));
});

test("reports the failing table instead of returning an incomplete backup", async () => {
    filasPorTabla = {};
    errorTabla = "persona";

    await assert.rejects(
        crearRespaldo(7),
        /No se pudo respaldar la tabla persona: consulta fallida/
    );
    errorTabla = null;
});

test("allows the backup when the optional credential table is not installed", async () => {
    filasPorTabla = {};
    const rutaSupabaseAdmin = require.resolve("../config/supabaseAdmin");
    require.cache[rutaSupabaseAdmin] = {
        exports: {
            obtenerSupabaseAdmin: () => ({
                from(nombre) {
                    return {
                        select() { return this; },
                        order() { return this; },
                        range() {
                            if (nombre === "usuario_credencial") {
                                return Promise.resolve({
                                    data: null,
                                    error: {
                                        code: "PGRST205",
                                        message: "Could not find the table public.usuario_credencial in the schema cache"
                                    }
                                });
                            }
                            return Promise.resolve({ data: [], error: null });
                        }
                    };
                }
            })
        }
    };

    delete require.cache[require.resolve("../services/adminRespaldosService")];
    const { crearRespaldo: crearRespaldoOpcional } =
        require("../services/adminRespaldosService");
    const respaldo = await crearRespaldoOpcional(7);

    assert.deepEqual(respaldo.tablas.usuario_credencial, []);
});
