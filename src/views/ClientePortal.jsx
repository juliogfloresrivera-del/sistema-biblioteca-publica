import { useEffect, useMemo, useState } from "react";
import BibliotecaLogo from "../components/BibliotecaLogo";
import { listarCatalogoCliente, obtenerPerfilCliente } from "../services/clientePortalService";

const ClientePortal = ({ usuario, onLogout }) => {
    const [seccion, setSeccion] = useState("catalogo");
    const [perfil, setPerfil] = useState(null);
    const [libros, setLibros] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;
        Promise.all([obtenerPerfilCliente(), listarCatalogoCliente()])
            .then(([perfilActual, catalogo]) => {
                if (!activo) return;
                setPerfil(perfilActual);
                setLibros(catalogo);
            })
            .catch((fallo) => {
                if (activo) setError(fallo.message || "No se pudo cargar tu información.");
            })
            .finally(() => {
                if (activo) setCargando(false);
            });
        return () => { activo = false; };
    }, []);

    const librosFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLocaleLowerCase("es");
        if (!termino) return libros;
        return libros.filter((libro) =>
            [libro.titulo, libro.isbn, libro.descripcion, libro.idioma]
                .some((valor) => String(valor || "").toLocaleLowerCase("es").includes(termino))
        );
    }, [busqueda, libros]);

    return (
        <div className="min-h-screen bg-biblioteca-paper">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8dfd3] bg-white px-5 py-4 sm:px-8">
                <BibliotecaLogo />
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm font-medium text-slate-600 sm:inline">
                        {perfil?.nombres || usuario?.nombres || usuario?.nombre_usuario}
                    </span>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <i className="bi bi-box-arrow-right mr-2"></i>Cerrar sesión
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
                <div className="mb-7">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Portal de cliente</p>
                    <h1 className="mt-1 font-serif text-3xl font-bold text-biblioteca-plum">
                        Hola, {perfil?.nombres || usuario?.nombres || "lector"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">Consulta el catálogo y los datos de tu membresía.</p>
                </div>

                <nav className="mb-6 flex gap-2" aria-label="Secciones del portal">
                    <button
                        type="button"
                        aria-pressed={seccion === "catalogo"}
                        onClick={() => setSeccion("catalogo")}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                            seccion === "catalogo" ? "bg-emerald-700 text-white" : "bg-white text-slate-700 shadow-sm"
                        }`}
                    >
                        <i className="bi bi-book mr-2"></i>Catálogo
                    </button>
                    <button
                        type="button"
                        aria-pressed={seccion === "perfil"}
                        onClick={() => setSeccion("perfil")}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                            seccion === "perfil" ? "bg-emerald-700 text-white" : "bg-white text-slate-700 shadow-sm"
                        }`}
                    >
                        <i className="bi bi-person-vcard mr-2"></i>Mi perfil
                    </button>
                </nav>

                {error && (
                    <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        {error}
                    </p>
                )}
                {cargando ? (
                    <p role="status" className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
                        Cargando tu portal...
                    </p>
                ) : seccion === "perfil" ? (
                    perfil ? (
                        <section className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2">
                            <DatoPerfil label="Carnet" valor={perfil.codigo_carnet} />
                            <DatoPerfil label="DNI" valor={perfil.dni} />
                            <DatoPerfil label="Nombres" valor={perfil.nombres} />
                            <DatoPerfil label="Apellidos" valor={[perfil.apellido_paterno, perfil.apellido_materno].filter(Boolean).join(" ")} />
                            <DatoPerfil label="Teléfono" valor={perfil.telefono} />
                            <DatoPerfil label="Dirección" valor={perfil.direccion} />
                        </section>
                    ) : null
                ) : (
                    <section>
                        <label className="mb-5 block max-w-xl">
                            <span className="sr-only">Buscar libros</span>
                            <div className="flex items-center rounded-xl border border-slate-300 bg-white px-3">
                                <i className="bi bi-search text-slate-400"></i>
                                <input
                                    type="search"
                                    value={busqueda}
                                    onChange={(event) => setBusqueda(event.target.value)}
                                    placeholder="Buscar por título, ISBN o descripción"
                                    className="w-full bg-transparent px-3 py-3 text-sm outline-none"
                                />
                            </div>
                        </label>
                        {librosFiltrados.length ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {librosFiltrados.map((libro) => (
                                    <article key={libro.id_libro} className="rounded-2xl border border-[#e8dfd3] bg-white p-5 shadow-sm">
                                        <h2 className="font-serif text-lg font-bold text-biblioteca-plum">{libro.titulo}</h2>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {libro.anio_publicacion || "Año no indicado"}
                                            {libro.idioma ? ` · ${libro.idioma}` : ""}
                                        </p>
                                        {libro.descripcion && (
                                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{libro.descripcion}</p>
                                        )}
                                        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                                            <i className="bi bi-bookshelf"></i>
                                            {libro.ejemplaresDisponibles} disponibles
                                        </p>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
                                {libros.length ? "No se encontraron libros con esa búsqueda." : "El catálogo todavía no tiene libros disponibles."}
                            </p>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

const DatoPerfil = ({ label, valor }) => (
    <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm text-slate-900">{valor || "No registrado"}</p>
    </div>
);

export default ClientePortal;
