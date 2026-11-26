const { obtenerSupabaseAdmin } = require("../config/supabaseAdmin");

const FILAS_POR_PAGINA = 1000;

const esTablaCredencialNoDisponible = (error) =>
    error?.code === "42P01" ||
    (
        error?.code === "PGRST205" &&
        String(error.message || "").includes("usuario_credencial")
    );

const TABLAS_RESPALDO = [
    { nombre: "apertura_caja", clavePrimaria: "id_aperturacaja" },
    { nombre: "auditoria", clavePrimaria: "id_auditoria" },
    { nombre: "boleta", clavePrimaria: "id_boleta" },
    { nombre: "caja", clavePrimaria: "id_caja" },
    { nombre: "cargo", clavePrimaria: "id_cargo" },
    { nombre: "categoria_habitacion", clavePrimaria: "id_categoria" },
    { nombre: "categoria_producto", clavePrimaria: "id_categoriaproducto" },
    { nombre: "cliente", clavePrimaria: "id_cliente" },
    { nombre: "concepto_caja", clavePrimaria: "id_concepto" },
    { nombre: "contrato", clavePrimaria: "id_contrato" },
    { nombre: "departamento", clavePrimaria: "id_departamento" },
    { nombre: "detalle_venta", clavePrimaria: "id_detalle" },
    { nombre: "distrito", clavePrimaria: "id_distrito" },
    { nombre: "empleado", clavePrimaria: "id_empleado" },
    { nombre: "empresa", clavePrimaria: "id_empresa" },
    { nombre: "estado_habitacion", clavePrimaria: "id_estadohabitacion" },
    { nombre: "factura", clavePrimaria: "id_factura" },
    { nombre: "habitacion", clavePrimaria: "id_habitacion" },
    { nombre: "metodo_pago", clavePrimaria: "id_metodopago" },
    { nombre: "modulo", clavePrimaria: "id_modulo" },
    { nombre: "movimiento_caja", clavePrimaria: "id_movimientocaja" },
    { nombre: "permiso", clavePrimaria: "id_permiso" },
    { nombre: "persona", clavePrimaria: "id_persona" },
    { nombre: "piso", clavePrimaria: "id_piso" },
    { nombre: "producto", clavePrimaria: "id_producto" },
    { nombre: "provincia", clavePrimaria: "id_provincia" },
    { nombre: "recepcion", clavePrimaria: "id_recepcion" },
    { nombre: "rol", clavePrimaria: "id_rol" },
    { nombre: "rol_permiso", clavePrimaria: "id_rolpermiso" },
    { nombre: "tipo_identidad", clavePrimaria: "id_tipoidentidad" },
    { nombre: "tipo_movimiento_caja", clavePrimaria: "id_tipomovimiento" },
    { nombre: "tipo_usuario", clavePrimaria: "id_tipousuario" },
    { nombre: "usuario", clavePrimaria: "id_usuario" },
    { nombre: "usuario_credencial", clavePrimaria: "id_usuario" },
    { nombre: "usuario_rol", clavePrimaria: "id_usuariorol" },
    { nombre: "venta", clavePrimaria: "id_venta" }
];

const obtenerFilasTabla = async (supabase, tabla) => {
    const filas = [];

    for (let desde = 0; ; desde += FILAS_POR_PAGINA) {
        const hasta = desde + FILAS_POR_PAGINA - 1;
        const { data, error } = await supabase
            .from(tabla.nombre)
            .select("*")
            .order(tabla.clavePrimaria, { ascending: true })
            .range(desde, hasta);

        if (error) {
            if (
                tabla.nombre === "usuario_credencial" &&
                esTablaCredencialNoDisponible(error)
            ) {
                return [];
            }
            throw new Error(`No se pudo respaldar la tabla ${tabla.nombre}: ${error.message}`);
        }

        const filasPagina = (data || []).map((fila) =>
            tabla.nombre === "usuario"
                ? { ...fila, clave: "" }
                : fila
        );
        filas.push(...filasPagina);
        if (!data || data.length < FILAS_POR_PAGINA) {
            return filas;
        }
    }
};

const crearRespaldo = async (idUsuario) => {
    const supabase = obtenerSupabaseAdmin();
    const tablas = {};

    for (const tabla of TABLAS_RESPALDO) {
        tablas[tabla.nombre] = await obtenerFilasTabla(supabase, tabla);
    }

    return {
        metadata: {
            formato: "hotel-sol-ica-backup",
            version: 1,
            generadoEn: new Date().toISOString(),
            generadoPor: idUsuario,
            camposOmitidos: {
                usuario: ["clave"]
            }
        },
        tablas
    };
};

module.exports = { crearRespaldo, FILAS_POR_PAGINA, TABLAS_RESPALDO };
