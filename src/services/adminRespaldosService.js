import { API_URL } from "../config/api";
import { obtenerSesion } from "./authSession";

export const descargarRespaldoAdmin = async () => {
    const sesion = obtenerSesion();
    if (!sesion?.token) {
        throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }

    let response;
    try {
        response = await fetch(`${API_URL}/admin/respaldos`, {
            headers: {
                Authorization: `Bearer ${sesion.token}`
            },
            cache: "no-store"
        });
    } catch (error) {
        console.error("No se pudo conectar con el servicio de respaldos:", error);
        throw new Error("No se pudo conectar con el servidor para generar el respaldo.");
    }

    if (!response.ok) {
        let mensaje = "No se pudo generar el respaldo del sistema.";
        try {
            const resultado = await response.json();
            mensaje = resultado?.message || mensaje;
        } catch {
            throw new Error("El servidor devolvió una respuesta inválida al generar el respaldo.");
        }
        throw new Error(mensaje);
    }

    const archivo = await response.blob();
    if (!archivo.size) {
        throw new Error("El servidor devolvió un respaldo vacío.");
    }

    const nombreDesdeServidor = response.headers
        .get("Content-Disposition")
        ?.match(/filename="?([^";]+)"?/i)?.[1];
    const fecha = new Date().toISOString().replace(/[:.]/g, "-");
    const nombreArchivo = nombreDesdeServidor || `respaldo-hotel-sol-ica-${fecha}.json`;
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    return nombreArchivo;
};
