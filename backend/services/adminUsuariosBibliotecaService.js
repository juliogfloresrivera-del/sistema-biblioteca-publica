const { obtenerSupabaseAdmin } = require("../config/supabaseAdmin");
const { hashearClave } = require("../utils/password");
const { esRolCliente } = require("../utils/roles");

const CAMPOS = "id_usuario,nombre_usuario,nombres,apellido_paterno,apellido_materno,correo,dni,estado,id_rol,bloqueado,intentos_fallidos";

const lanzarError = (error) => {
    if (!error) return;
    const resultado = new Error(error.message || "No se pudo completar la operación de usuarios.");
    resultado.status = error.code === "23505" ? 409 : error.code === "23503" ? 400 : 500;
    throw resultado;
};

const idValido = (valor, campo) => {
    const id = Number(valor);
    if (!Number.isSafeInteger(id) || id < 1) {
        const error = new Error(`Selecciona un ${campo} válido.`);
        error.status = 400;
        throw error;
    }
    return id;
};

const validar = (entrada, nuevo) => {
    const nombreUsuario = String(entrada.nombre_usuario || "").trim();
    const clave = String(entrada.clave || "");
    const nombres = String(entrada.nombres || "").trim();
    const apellidoPaterno = String(entrada.apellido_paterno || "").trim();
    const correo = String(entrada.correo || "").trim();

    if (nombreUsuario.length < 3 || nombreUsuario.length > 100) {
        const error = new Error("El usuario debe tener entre 3 y 100 caracteres.");
        error.status = 400;
        throw error;
    }
    if ((nuevo || clave) && (clave.length < 10 || clave.length > 128)) {
        const error = new Error("La contraseña debe tener entre 10 y 128 caracteres.");
        error.status = 400;
        throw error;
    }
    if (!nombres || !apellidoPaterno || !correo) {
        const error = new Error("Completa nombres, apellido y correo.");
        error.status = 400;
        throw error;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        const error = new Error("Ingresa un correo válido.");
        error.status = 400;
        throw error;
    }

    return {
        nombre_usuario: nombreUsuario,
        clave,
        nombres,
        apellido_paterno: apellidoPaterno,
        apellido_materno: String(entrada.apellido_materno || "").trim() || null,
        correo,
        dni: String(entrada.dni || "").trim() || null,
        id_rol: idValido(entrada.id_rol, "rol"),
        ...(entrada.id_lector == null || String(entrada.id_lector).trim() === ""
            ? {}
            : { id_lector: idValido(entrada.id_lector, "lector") })
    };
};

const obtenerRolActivo = async (supabase, idRol) => {
    const { data, error } = await supabase
        .from("rol")
        .select("id_rol,nombre_rol")
        .eq("id_rol", idRol)
        .eq("estado", "A")
        .maybeSingle();
    lanzarError(error);
    if (!data) {
        const invalido = new Error("El rol seleccionado no está activo.");
        invalido.status = 400;
        throw invalido;
    }
    return data;
};

const cantidadAdministradores = async (supabase) => {
    const { data: rol, error: errorRol } = await supabase
        .from("rol")
        .select("id_rol")
        .eq("nombre_rol", "ADMINISTRADOR")
        .eq("estado", "A")
        .maybeSingle();
    lanzarError(errorRol);
    if (!rol) return { idRol: null, cantidad: 0 };

    const { count, error } = await supabase
        .from("usuario")
        .select("id_usuario", { count: "exact", head: true })
        .eq("id_rol", rol.id_rol)
        .eq("estado", "A");
    lanzarError(error);
    return { idRol: rol.id_rol, cantidad: count || 0 };
};

const listarUsuarios = async ({ pagina = 1, pageSize = 25, busqueda = "" } = {}) => {
    const supabase = obtenerSupabaseAdmin();
    const numeroPagina = Math.max(1, Math.floor(Number(pagina) || 1));
    const tamanoPagina = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 25)));
    const desde = (numeroPagina - 1) * tamanoPagina;
    const termino = String(busqueda || "").trim().replace(/[%_,()]/g, " ");
    let consulta = supabase
        .from("usuario")
        .select(CAMPOS, { count: "exact" })
        .eq("estado", "A");

    if (termino) {
        const seguro = termino.replace(/\\/g, "");
        consulta = consulta.or([
            `nombre_usuario.ilike.%${seguro}%`,
            `nombres.ilike.%${seguro}%`,
            `apellido_paterno.ilike.%${seguro}%`,
            `correo.ilike.%${seguro}%`
        ].join(","));
    }

    const { data, error, count } = await consulta
        .order("id_usuario", { ascending: true })
        .range(desde, desde + tamanoPagina - 1);
    lanzarError(error);
    return {
        data: data || [],
        total: count || 0,
        pagina: numeroPagina,
        totalPaginas: Math.max(1, Math.ceil((count || 0) / tamanoPagina))
    };
};

const obtenerOpciones = async () => {
    const supabase = obtenerSupabaseAdmin();
    const [resultadoRoles, resultadoLectores] = await Promise.all([
        supabase
            .from("rol")
            .select("id_rol,nombre_rol")
            .eq("estado", "A")
            .order("nombre_rol"),
        supabase
            .from("lector")
            .select("id_lector,codigo_carnet,dni,nombres,apellido_paterno,apellido_materno,id_usuario")
            .eq("estado", "A")
            .is("id_usuario", null)
            .order("id_lector", { ascending: true })
    ]);
    lanzarError(resultadoRoles.error);
    lanzarError(resultadoLectores.error);
    return {
        tipos: [],
        empleados: [],
        roles: resultadoRoles.data || [],
        lectores: resultadoLectores.data || []
    };
};

const crearUsuario = async (entrada) => {
    const supabase = obtenerSupabaseAdmin();
    const datos = validar(entrada, true);
    const rol = await obtenerRolActivo(supabase, datos.id_rol);
    const esCliente = esRolCliente(rol.nombre_rol);
    if (esCliente && !datos.id_lector) {
        const error = new Error("Selecciona el socio o lector que se vinculará a esta cuenta.");
        error.status = 400;
        throw error;
    }
    if (!esCliente && datos.id_lector) {
        const error = new Error("Solo las cuentas con rol de cliente pueden vincularse a un lector.");
        error.status = 400;
        throw error;
    }

    const { clave, id_lector: idLector, ...fila } = datos;
    const { data: usuario, error: errorUsuario } = await supabase.from("usuario").insert({
        ...fila,
        clave_hash: await hashearClave(clave),
        estado: "A",
        bloqueado: false,
        intentos_fallidos: 0
    }).select("id_usuario").single();
    lanzarError(errorUsuario);

    if (esCliente) {
        const { data: lector, error: errorLector } = await supabase
            .from("lector")
            .update({ id_usuario: usuario.id_usuario })
            .eq("id_lector", idLector)
            .eq("estado", "A")
            .is("id_usuario", null)
            .select("id_lector")
            .maybeSingle();

        if (errorLector || !lector) {
            const { error: errorLimpieza } = await supabase
                .from("usuario")
                .delete()
                .eq("id_usuario", usuario.id_usuario);
            if (errorLimpieza) {
                console.error("No se pudo revertir la cuenta al fallar el vínculo con el lector:", errorLimpieza);
                throw new Error("No se pudo vincular el lector y tampoco revertir la cuenta creada. Revisa los datos en el sistema.");
            }
            if (errorLector) lanzarError(errorLector);
            const error = new Error("El socio o lector ya tiene una cuenta vinculada o no está activo.");
            error.status = 409;
            throw error;
        }
    }
};

const actualizarUsuario = async (idEntrada, entrada) => {
    const supabase = obtenerSupabaseAdmin();
    const idUsuario = idValido(idEntrada, "usuario");
    const datos = validar(entrada, false);
    const rol = await obtenerRolActivo(supabase, datos.id_rol);
    const { data: existente, error: errorExistente } = await supabase
        .from("usuario")
        .select("id_usuario,id_rol")
        .eq("id_usuario", idUsuario)
        .eq("estado", "A")
        .maybeSingle();
    lanzarError(errorExistente);
    if (!existente) {
        const error = new Error("No se encontró el usuario activo que quieres editar.");
        error.status = 404;
        throw error;
    }
    if (esRolCliente(rol.nombre_rol)) {
        const { data: lectorVinculado, error: errorLector } = await supabase
            .from("lector")
            .select("id_lector")
            .eq("id_usuario", idUsuario)
            .eq("estado", "A")
            .maybeSingle();
        lanzarError(errorLector);
        if (!lectorVinculado) {
            const error = new Error("Para asignar un rol de cliente, la cuenta debe estar vinculada a un socio activo.");
            error.status = 409;
            throw error;
        }
    }

    const administradores = await cantidadAdministradores(supabase);
    const eraAdministrador = String(existente.id_rol) === String(administradores.idRol);
    const seraAdministrador = String(rol.nombre_rol).toUpperCase() === "ADMINISTRADOR";
    if (eraAdministrador && !seraAdministrador && administradores.cantidad <= 1) {
        const error = new Error("No se puede quitar el rol del último administrador activo.");
        error.status = 409;
        throw error;
    }

    const actualizacion = { ...datos };
    const clave = actualizacion.clave;
    delete actualizacion.clave;
    delete actualizacion.id_lector;
    if (clave) actualizacion.clave_hash = await hashearClave(clave);
    const { error } = await supabase
        .from("usuario")
        .update(actualizacion)
        .eq("id_usuario", idUsuario)
        .eq("estado", "A");
    lanzarError(error);
};

const darDeBajaUsuario = async (idEntrada, idSolicitante) => {
    const supabase = obtenerSupabaseAdmin();
    const idUsuario = idValido(idEntrada, "usuario");
    const { data: usuario, error: errorUsuario } = await supabase
        .from("usuario")
        .select("id_usuario,id_rol")
        .eq("id_usuario", idUsuario)
        .eq("estado", "A")
        .maybeSingle();
    lanzarError(errorUsuario);
    if (!usuario) {
        const error = new Error("No se encontró el usuario activo que quieres dar de baja.");
        error.status = 404;
        throw error;
    }

    const administradores = await cantidadAdministradores(supabase);
    if (String(usuario.id_rol) === String(administradores.idRol) && administradores.cantidad <= 1) {
        const error = new Error("No se puede dar de baja al último administrador activo.");
        error.status = 409;
        throw error;
    }
    if (String(idUsuario) === String(idSolicitante) && administradores.cantidad <= 1) {
        const error = new Error("No puedes dar de baja tu cuenta si eres el último administrador.");
        error.status = 409;
        throw error;
    }

    const { error } = await supabase
        .from("usuario")
        .update({ estado: "I" })
        .eq("id_usuario", idUsuario)
        .eq("estado", "A");
    lanzarError(error);
};

module.exports = {
    actualizarUsuario,
    crearUsuario,
    darDeBajaUsuario,
    listarUsuarios,
    obtenerOpciones
};
