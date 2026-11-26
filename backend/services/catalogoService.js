const { obtenerSupabaseAdmin } = require("../config/supabaseAdmin");

const ENTIDADES_CATALOGO = {
    autor: {
        pk: "id_autor",
        campos: ["nombres", "apellido_paterno", "apellido_materno", "nacionalidad", "fecha_nacimiento"],
        obligatorios: ["nombres", "apellido_paterno"]
    },
    editorial: {
        pk: "id_editorial",
        campos: ["nombre_editorial", "pais"],
        obligatorios: ["nombre_editorial"]
    },
    categoria: {
        pk: "id_categoria",
        campos: ["nombre_categoria"],
        obligatorios: ["nombre_categoria"]
    },
    libro: {
        pk: "id_libro",
        campos: [
            "titulo", "isbn", "id_autor", "id_editorial", "id_categoria",
            "anio_publicacion", "numero_paginas", "idioma", "descripcion", "portada_url"
        ],
        obligatorios: ["titulo", "id_autor", "idioma"]
    },
    ejemplar: {
        pk: "id_ejemplar",
        campos: ["id_libro", "codigo_barras", "ubicacion", "estado_fisico", "disponible", "fecha_ingreso"],
        obligatorios: ["id_libro", "codigo_barras", "estado_fisico", "fecha_ingreso"]
    }
};

const CAMPOS_NUMERICOS = new Set([
    "id_autor", "id_editorial", "id_categoria", "id_libro",
    "anio_publicacion", "numero_paginas"
]);
const CAMPOS_FECHA = new Set(["fecha_nacimiento", "fecha_ingreso"]);
const LIMITES_TEXTO = {
    nombres: 150,
    apellido_paterno: 150,
    apellido_materno: 150,
    nacionalidad: 100,
    nombre_editorial: 200,
    pais: 100,
    nombre_categoria: 200,
    titulo: 250,
    isbn: 30,
    idioma: 50,
    descripcion: 2000,
    portada_url: 500,
    codigo_barras: 100,
    ubicacion: 150,
    estado_fisico: 20
};

const errorEntrada = (mensaje) => {
    const error = new Error(mensaje);
    error.status = 400;
    return error;
};

const obtenerEntidad = (tabla) => {
    const entidad = ENTIDADES_CATALOGO[tabla];
    if (!entidad) {
        const error = new Error("La entidad solicitada no pertenece al catálogo.");
        error.status = 404;
        throw error;
    }
    return entidad;
};

const validarEntrada = (entidad, entrada, parcial) => {
    if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) {
        throw errorEntrada("Envía los datos del registro en un formato válido.");
    }

    const desconocidos = Object.keys(entrada).filter((campo) => !entidad.campos.includes(campo));
    if (desconocidos.length) {
        throw errorEntrada(`No se permiten estos campos: ${desconocidos.join(", ")}.`);
    }

    const datos = {};
    for (const campo of entidad.campos) {
        if (!Object.prototype.hasOwnProperty.call(entrada, campo)) continue;
        const valor = entrada[campo];
        if (entidad.obligatorios.includes(campo) && (valor == null || String(valor).trim() === "")) {
            throw errorEntrada(`El campo "${campo}" es obligatorio.`);
        }
        if (valor == null || valor === "") {
            datos[campo] = null;
        } else if (CAMPOS_NUMERICOS.has(campo)) {
            const numero = Number(valor);
            if (!Number.isSafeInteger(numero) || numero < 0 || (campo.startsWith("id_") && numero < 1)) {
                throw errorEntrada(`El campo "${campo}" debe ser un número entero válido.`);
            }
            if (campo === "numero_paginas" && numero < 1) {
                throw errorEntrada('El campo "numero_paginas" debe ser mayor que cero.');
            }
            datos[campo] = numero;
        } else if (campo === "disponible") {
            if (valor !== true && valor !== false && valor !== "true" && valor !== "false") {
                throw errorEntrada('El campo "disponible" debe ser verdadero o falso.');
            }
            datos[campo] = valor === true || valor === "true";
        } else if (CAMPOS_FECHA.has(campo)) {
            const fecha = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
                ? new Date(`${valor}T00:00:00.000Z`)
                : null;
            if (!fecha || Number.isNaN(fecha.valueOf()) || fecha.toISOString().slice(0, 10) !== valor) {
                throw errorEntrada(`El campo "${campo}" debe tener una fecha válida.`);
            }
            datos[campo] = valor;
        } else {
            if (typeof valor !== "string") {
                throw errorEntrada(`El campo "${campo}" debe ser texto.`);
            }
            const texto = valor.trim();
            if (texto.length > LIMITES_TEXTO[campo]) {
                throw errorEntrada(`El campo "${campo}" excede el máximo de ${LIMITES_TEXTO[campo]} caracteres.`);
            }
            if (campo === "estado_fisico" && !["BUENO", "REGULAR", "MALO"].includes(texto)) {
                throw errorEntrada('El campo "estado_fisico" no es válido.');
            }
            datos[campo] = texto || null;
        }
    }

    if (!parcial) {
        for (const campo of entidad.obligatorios) {
            if (!Object.prototype.hasOwnProperty.call(datos, campo)) {
                throw errorEntrada(`El campo "${campo}" es obligatorio.`);
            }
        }
    }

    if (!Object.keys(datos).length) {
        throw errorEntrada("Incluye al menos un campo para guardar.");
    }

    return datos;
};

const obtenerId = (valor) => {
    const id = Number(valor);
    if (!Number.isSafeInteger(id) || id < 1) {
        throw errorEntrada("El identificador del registro no es válido.");
    }
    return id;
};

const guardarErrorBaseDatos = (error) => {
    if (error.code === "23505") {
        const duplicado = new Error("Ya existe un registro con ese valor único.");
        duplicado.status = 409;
        return duplicado;
    }
    if (error.code === "23503") {
        const referencia = new Error("El autor, editorial, categoría o libro seleccionado ya no existe.");
        referencia.status = 400;
        return referencia;
    }

    const resultado = new Error(error.message || "No se pudo guardar el registro del catálogo.");
    resultado.status = error.status || 500;
    return resultado;
};

const lanzarError = (error) => {
    if (error) throw guardarErrorBaseDatos(error);
};

const crearRegistro = async (tabla, entrada) => {
    const entidad = obtenerEntidad(tabla);
    const datos = validarEntrada(entidad, entrada, false);
    datos.estado = "A";

    const supabase = obtenerSupabaseAdmin();
    const { error } = await supabase.from(tabla).insert([datos]);
    lanzarError(error);
};

const actualizarRegistro = async (tabla, valorId, entrada) => {
    const entidad = obtenerEntidad(tabla);
    const id = obtenerId(valorId);
    const datos = validarEntrada(entidad, entrada, true);

    const supabase = obtenerSupabaseAdmin();
    const { error } = await supabase
        .from(tabla)
        .update(datos)
        .eq(entidad.pk, id);
    lanzarError(error);
};

const darDeBajaRegistro = async (tabla, valorId) => {
    const entidad = obtenerEntidad(tabla);
    const id = obtenerId(valorId);

    const supabase = obtenerSupabaseAdmin();
    const { error } = await supabase
        .from(tabla)
        .update({ estado: "I" })
        .eq(entidad.pk, id);
    lanzarError(error);
};

module.exports = { actualizarRegistro, crearRegistro, darDeBajaRegistro };
