import { API_URL } from "../config/api";
import { obtenerSesion } from "./authSession";

const solicitar = async (recurso) => {
    const sesion = obtenerSesion();
    if (!sesion?.token) {
        throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }

    let response;
    try {
        response = await fetch(`${API_URL}/cliente/${recurso}`, {
            headers: { Authorization: `Bearer ${sesion.token}` }
        });
    } catch (error) {
        console.error("No se pudo conectar con el portal de cliente:", error);
        throw new Error("No se pudo conectar con el portal de cliente.");
    }

    let resultado;
    try {
        resultado = await response.json();
    } catch {
        throw new Error("El servidor devolvió una respuesta inválida al cargar el portal de cliente.");
    }

    if (!response.ok || !resultado?.success) {
        throw new Error(resultado?.message || "No se pudo cargar el portal de cliente.");
    }
    return resultado;
};

export const obtenerPerfilCliente = async () => {
    const resultado = await solicitar("perfil");
    return resultado.perfil;
};

export const listarCatalogoCliente = async () => {
    const resultado = await solicitar("catalogo");
    return resultado.data;
};
