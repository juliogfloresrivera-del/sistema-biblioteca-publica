const { obtenerSupabaseAdmin } = require("../config/supabaseAdmin");

const lanzarError = (error) => {
    if (!error) return;
    const resultado = new Error(error.message || "No se pudo cargar el portal de cliente.");
    resultado.status = 500;
    throw resultado;
};

const obtenerPerfilCliente = async (idUsuario) => {
    const supabase = obtenerSupabaseAdmin();
    const { data, error } = await supabase
        .from("lector")
        .select("id_lector,codigo_carnet,dni,nombres,apellido_paterno,apellido_materno,fecha_nacimiento,telefono,direccion")
        .eq("id_usuario", idUsuario)
        .eq("estado", "A")
        .maybeSingle();
    lanzarError(error);
    if (!data) {
        const noEncontrado = new Error("Tu cuenta todavía no está vinculada a un socio activo.");
        noEncontrado.status = 404;
        throw noEncontrado;
    }
    return data;
};

const listarCatalogoCliente = async () => {
    const supabase = obtenerSupabaseAdmin();
    const [resultadoLibros, resultadoEjemplares] = await Promise.all([
        supabase
            .from("libro")
            .select("id_libro,titulo,isbn,anio_publicacion,idioma,descripcion,portada_url")
            .eq("estado", "A")
            .order("titulo", { ascending: true }),
        supabase
            .from("ejemplar")
            .select("id_libro")
            .eq("estado", "A")
            .eq("disponible", true)
    ]);
    lanzarError(resultadoLibros.error);
    lanzarError(resultadoEjemplares.error);

    const disponiblesPorLibro = new Map();
    for (const ejemplar of resultadoEjemplares.data || []) {
        disponiblesPorLibro.set(
            ejemplar.id_libro,
            (disponiblesPorLibro.get(ejemplar.id_libro) || 0) + 1
        );
    }
    return (resultadoLibros.data || []).map((libro) => ({
        ...libro,
        ejemplaresDisponibles: disponiblesPorLibro.get(libro.id_libro) || 0
    }));
};

module.exports = { listarCatalogoCliente, obtenerPerfilCliente };
