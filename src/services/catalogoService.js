import { API_URL } from "../config/api";
import { obtenerSesion } from "./authSession";

const TABLAS_CATALOGO = new Set(["autor", "editorial", "categoria", "libro", "ejemplar"]);

const solicitar = async (tabla, ruta, opciones = {}) => {
    if (!TABLAS_CATALOGO.has(tabla)) {
        throw new Error("La entidad solicitada no pertenece al catálogo.");
    }

    const sesion = obtenerSesion();
    if (!sesion?.token) {
        throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }

    let response;
    try {
        response = await fetch(`${API_URL}/catalogo/${encodeURIComponent(tabla)}${ruta}`, {
            ...opciones,
            headers: {
                Authorization: `Bearer ${sesion.token}`,
                ...(opciones.body ? { "Content-Type": "application/json" } : {}),
                ...opciones.headers
            }
        });
    } catch (error) {
        console.error("No se pudo conectar con la gestión del catálogo:", error);
        throw new Error("No se pudo conectar con el servidor del catálogo.");
    }

    let resultado;
    try {
        resultado = await response.json();
    } catch {
        throw new Error("El servidor devolvió una respuesta inválida al gestionar el catálogo.");
    }

    if (!response.ok || !resultado?.success) {
        throw new Error(resultado?.message || "No se pudo completar la operación del catálogo.");
    }
    return resultado;
};

export const esTablaCatalogo = (tabla) => TABLAS_CATALOGO.has(tabla);

export const crearRegistroCatalogo = (tabla, datos) => solicitar(tabla, "", {
    method: "POST",
    body: JSON.stringify(datos)
});

export const actualizarRegistroCatalogo = (tabla, id, datos) => solicitar(
    tabla,
    `/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(datos) }
);

export const darDeBajaRegistroCatalogo = (tabla, id) => solicitar(
    tabla,
    `/${encodeURIComponent(id)}`,
    { method: "DELETE" }
);
