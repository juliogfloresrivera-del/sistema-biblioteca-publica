const { obtenerSupabaseAdmin } = require("../config/supabaseAdmin");
const { verificarClave } = require("../utils/password");

const CAMPOS_USUARIO =
    "id_usuario,nombre_usuario,clave_hash,nombres,apellido_paterno,correo,estado,id_rol,bloqueado,intentos_fallidos";

const normalizarUsuario = (fila) => {
    if (!fila) return null;

    return {
        ...fila,
        nombre_usuario: fila.nombre_usuario ?? fila.correo ?? "",
        correo: fila.correo ?? fila.nombre_usuario ?? "",
        nombres: fila.nombres ?? fila.nombre_usuario ?? "",
        apellido_paterno: fila.apellido_paterno ?? "",
        estado: fila.estado ?? "A",
        bloqueado: Boolean(fila.bloqueado),
        intentos_fallidos: Number(fila.intentos_fallidos ?? 0)
    };
};

const buscarUsuarioPorLogeo = async (identificador) => {
    const valor = String(identificador || "").trim();
    if (!valor) return null;

    const supabase = obtenerSupabaseAdmin();
    const esCorreo = valor.includes("@");
    const columnaPrincipal = esCorreo ? "correo" : "nombre_usuario";
    const columnaSecundaria = esCorreo ? "nombre_usuario" : "correo";
    const valorBusqueda = esCorreo ? valor.toLowerCase() : valor;

    const { data: primeraData, error: primeraError } = await supabase
        .from("usuario")
        .select(CAMPOS_USUARIO)
        .eq(columnaPrincipal, valorBusqueda)
        .maybeSingle();

    if (primeraError) throw primeraError;
    if (primeraData) return normalizarUsuario(primeraData);

    const { data: segundaData, error: segundaError } = await supabase
        .from("usuario")
        .select(CAMPOS_USUARIO)
        .eq(columnaSecundaria, valor)
        .maybeSingle();

    if (segundaError) throw segundaError;
    return segundaData ? normalizarUsuario(segundaData) : null;
};

const buscarUsuarioActivoPorId = async (idUsuario) => {
    const supabase = obtenerSupabaseAdmin();
    for (const estado of ["A", "1"]) {
        const { data, error } = await supabase
            .from("usuario")
            .select("id_usuario")
            .eq("id_usuario", idUsuario)
            .eq("estado", estado)
            .maybeSingle();

        if (error) throw error;
        if (data) return true;
    }
    return false;
};

const verificarCredencialUsuario = async (usuario, claveIngresada) => {
    if (!usuario?.clave_hash) return false;
    return verificarClave(claveIngresada, usuario.clave_hash);
};

module.exports = {
    buscarUsuarioActivoPorId,
    buscarUsuarioPorLogeo,
    verificarCredencialUsuario
};
