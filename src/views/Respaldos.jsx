import { useState } from "react";

import { descargarRespaldoAdmin } from "../services/adminRespaldosService";

const Respaldos = () => {
    const [generando, setGenerando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    const generarRespaldo = async () => {
        setGenerando(true);
        setMensaje("");
        setError("");

        try {
            const nombreArchivo = await descargarRespaldoAdmin();
            setMensaje(`Respaldo descargado correctamente: ${nombreArchivo}`);
        } catch (errorDescarga) {
            setError(errorDescarga.message || "No se pudo generar el respaldo.");
        } finally {
            setGenerando(false);
        }
    };

    return (
        <section className="mx-auto max-w-4xl">
            <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
                    Administración del sistema
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    Copia de seguridad
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Genera y descarga un archivo JSON con los datos de las tablas
                    del sistema, incluidos los registros inactivos.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                        <i className="bi bi-database-down text-2xl" aria-hidden="true"></i>
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-900">
                            Respaldo completo de datos
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            El archivo incluye información personal, operaciones del
                            hotel y hashes de credenciales. El campo heredado de
                            contraseña <code>usuario.clave</code> se entrega vacío para
                            no exportar contraseñas en texto claro; las cuentas sin un
                            hash guardado necesitarán restablecer su contraseña si se
                            restaura el respaldo. Guárdalo únicamente en un lugar
                            protegido y compártelo solo con personal autorizado. No
                            contiene la estructura de la base de datos ni archivos
                            almacenados fuera de las tablas.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={generarRespaldo}
                    disabled={generando}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-wait disabled:opacity-60"
                >
                    <i
                        className={`bi ${generando ? "bi-arrow-repeat animate-spin" : "bi-download"}`}
                        aria-hidden="true"
                    ></i>
                    {generando ? "Generando respaldo..." : "Generar y descargar"}
                </button>

                {mensaje && (
                    <p role="status" className="mt-4 text-sm text-emerald-700">
                        {mensaje}
                    </p>
                )}
                {error && (
                    <p role="alert" className="mt-4 text-sm text-red-700">
                        {error}
                    </p>
                )}
            </div>
        </section>
    );
};

export default Respaldos;
