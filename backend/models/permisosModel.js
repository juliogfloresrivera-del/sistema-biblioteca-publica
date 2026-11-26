const supabase = require("../config/supabase");

const obtenerPermisosUsuario = async (idUsuario) => {
  let usuarioConsulta = await supabase
    .from("usuario")
    .select("id_tipousuario")
    .eq("id_usuario", idUsuario)
    .eq("estado", "1")
    .maybeSingle();

  if (!usuarioConsulta.error && usuarioConsulta.data) {
    const { data: tipo, error: errorTipo } = await supabase
      .from("tipo_usuario")
      .select("n_tipousuario")
      .eq("id_tipousuario", usuarioConsulta.data.id_tipousuario)
      .eq("estado", "1")
      .maybeSingle();
    if (errorTipo) throw errorTipo;

    const nombreRol = tipo?.n_tipousuario || "ADMINISTRADOR";
    return {
      roles: [nombreRol],
      modulos: ["CATALOGO", "CIRCULACION", "SOCIOS", "USUARIOS", "REPORTES"]
    };
  }

  usuarioConsulta = await supabase
    .from("usuario")
    .select("id_rol")
    .eq("id_usuario", idUsuario)
    .eq("estado", "A")
    .maybeSingle();
  if (usuarioConsulta.error) throw usuarioConsulta.error;
  const usuario = usuarioConsulta.data;
  if (!usuario?.id_rol) return { roles: [], modulos: [] };

  const { data: rol, error: errorRol } = await supabase
    .from("rol")
    .select("id_rol,nombre_rol")
    .eq("id_rol", usuario.id_rol)
    .eq("estado", "A")
    .maybeSingle();
  if (errorRol) throw errorRol;

  const nombreRol = rol?.nombre_rol || "";
  return {
    roles: nombreRol ? [nombreRol] : [],
    modulos: nombreRol ? ["CATALOGO", "CIRCULACION", "SOCIOS", "USUARIOS", "REPORTES"] : []
  };
};

module.exports = { obtenerPermisosUsuario };
