import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BibliotecaLogo from "../components/BibliotecaLogo";
import CrudModule from "../components/CrudModule";
import { ENTIDADES } from "../config/entidades";
import { supabase } from "../config/supabase";
import { cerrarSesion, obtenerSesion } from "../services/authSession";
import MetodosPago from "./MetodosPago";
import ClientePortal from "./ClientePortal";

const MENU = [
  { clave: "socios", nombre: "Socios", icono: "bi-person-badge" },
  { clave: "materiales", nombre: "Materiales", icono: "bi-journals" },
  { clave: "ejemplares", nombre: "Ejemplares", icono: "bi-box-seam" },
  { clave: "prestamos", nombre: "Préstamos", icono: "bi-arrow-left-right" },
  { clave: "reservas", nombre: "Reservas", icono: "bi-calendar-check" },
  { clave: "pagos", nombre: "Métodos de pago", icono: "bi-credit-card" },
  { clave: "autores", nombre: "Autores", icono: "bi-person-lines-fill" },
  { clave: "editoriales", nombre: "Editoriales", icono: "bi-building" },
  { clave: "usuarios", nombre: "Usuarios", icono: "bi-person-gear" },
];

const LECTURAS_BASE = [
  {
    id: "guia-lectura",
    titulo: "Guía de Lectura Pública y Archivo",
    autor: "Red de Bibliotecas · Edición Digital",
    paginas: [
      "Las bibliotecas públicas son espacios abiertos donde el conocimiento circula sin barreras. En este lector digital puedes ajustar el tamaño de letra, cambiar el tono de página y avanzar entre secciones de forma cómoda tanto en computadora como en móvil.",
      "Para una lectura prolongada, el modo sepia reduce el contraste agresivo de las pantallas blancas, mientras que el modo oscuro resulta útil en entornos con poca iluminación.",
      "También puedes cargar tus propios archivos de texto (.txt o .md) desde tu dispositivo para revisar borradores, apuntes o fragmentos literarios directamente dentro del panel.",
    ],
  },
  {
    id: "cuentos-caminos",
    titulo: "Crónicas de Caminos y Voces Locales",
    autor: "Colección Cultural Digital",
    paginas: [
      "Cada comunidad conserva historias que nacen en sus plazas, mercados y senderos. Preservar esos relatos en formato digital permite que nuevas generaciones los consulten en cualquier momento.",
      "La combinación de catálogo físico y lectura digital amplía el alcance de la biblioteca más allá de sus horarios tradicionales.",
    ],
  },
];

const obtenerTemaPorRol = (usuario, roles = []) => {
  const rawRol = String(
    usuario?.rol ??
      usuario?.tipo_usuario ??
      usuario?.perfil ??
      usuario?.nombre_rol ??
      roles[0] ??
      ""
  ).toLowerCase();

  const esSocioOCliente =
    rawRol.includes("socio") ||
    rawRol.includes("cliente") ||
    rawRol.includes("lector") ||
    rawRol.includes("usuario") ||
    usuario?.id_rol === 2 ||
    usuario?.id_rol === 3;
  const esAdmin = rawRol.trim().toUpperCase() === "ADMINISTRADOR";

  if (esSocioOCliente) {
    return {
      esAdmin: false,
      esCliente: true,
      etiquetaRol: usuario?.rol || usuario?.tipo_usuario || "Socio / Cliente",
      asideClase: "bg-slate-900 text-white",
      overlayClase: "bg-slate-950/50",
      activoClase: "sidebar-item bg-emerald-600 text-white",
      badgeClase: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30",
      acentoTexto: "text-emerald-600",
      avatarClase: "bg-emerald-600 text-white",
    };
  }

  return {
    esAdmin,
    esCliente: false,
    etiquetaRol: usuario?.rol || usuario?.tipo_usuario || roles[0] || "Usuario",
    asideClase: "bg-biblioteca-plum text-white",
    overlayClase: "bg-biblioteca-plum/40",
    activoClase: "sidebar-item bg-biblioteca-coral text-white",
    badgeClase: "bg-orange-400/20 text-orange-100 border border-orange-300/30",
    acentoTexto: "text-biblioteca-coral",
    avatarClase: "bg-biblioteca-coral text-white",
  };
};

const LectorDigital = () => {
  const [lecturas, setLecturas] = useState(LECTURAS_BASE);
  const [lecturaId, setLecturaId] = useState(LECTURAS_BASE[0].id);
  const [paginaIdx, setPaginaIdx] = useState(0);
  const [tamanoFuente, setTamanoFuente] = useState(18);
  const [modoTema, setModoTema] = useState("claro"); // "claro" | "sepia" | "oscuro"
  const [modoEnfocado, setModoEnfocado] = useState(false);

  const lecturaActual = useMemo(
    () => lecturas.find((item) => item.id === lecturaId) || lecturas[0],
    [lecturas, lecturaId]
  );

  const totalPaginas = lecturaActual.paginas.length;
  const paginaSegura = Math.min(paginaIdx, Math.max(0, totalPaginas - 1));
  const progreso = Math.round(((paginaSegura + 1) / totalPaginas) * 100);

  const cambiarLectura = (nuevoId) => {
    setLecturaId(nuevoId);
    setPaginaIdx(0);
  };

  const manejarArchivo = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const texto = await archivo.text();
    const limpio = texto.trim();
    if (!limpio) return;

    const trozos = limpio.match(/[\s\S]{1,900}(?:\s|$)/g) || [limpio];
    const nuevaLectura = {
      id: `archivo-${Date.now()}`,
      titulo: archivo.name.replace(/\.(txt|md)$/i, ""),
      autor: `Archivo local (${archivo.name})`,
      paginas: trozos.map((p) => p.trim()).filter(Boolean),
    };

    setLecturas((prev) => [nuevaLectura, ...prev]);
    setLecturaId(nuevaLectura.id);
    setPaginaIdx(0);
    e.target.value = "";
  };

  const hojaEstilos = {
    claro: "bg-white text-slate-800 border-slate-200",
    sepia: "bg-[#f6efe2] text-[#3b2f23] border-[#e2d3b7]",
    oscuro: "bg-slate-900 text-slate-100 border-slate-700",
  }[modoTema];

  return (
    <section className={modoEnfocado ? "fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 p-4 sm:p-8" : "space-y-5"}>
      <div className={`rounded-2xl border p-4 sm:p-6 shadow-sm ${modoEnfocado ? "mx-auto max-w-4xl border-slate-700 bg-slate-900 text-white" : "border-[#e8dfd3] bg-white"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-slate-700">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-biblioteca-coral">Lector digital</p>
            <h2 className="font-serif text-xl sm:text-2xl font-bold">{lecturaActual.titulo}</h2>
            <p className="text-xs sm:text-sm opacity-75">{lecturaActual.autor}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Seleccionar lectura"
              value={lecturaId}
              onChange={(e) => cambiarLectura(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800"
            >
              {lecturas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.titulo}
                </option>
              ))}
            </select>

            <label className="cursor-pointer rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100">
              <i className="bi bi-upload mr-1.5"></i>
              Cargar .txt / .md
              <input type="file" accept=".txt,.md,text/plain" onChange={manejarArchivo} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() => setModoEnfocado((v) => !v)}
              className="rounded-xl bg-slate-800 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-slate-700"
            >
              <i className={`bi ${modoEnfocado ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"} mr-1.5`}></i>
              {modoEnfocado ? "Salir de enfoque" : "Modo enfoque"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTamanoFuente((t) => Math.max(14, t - 2))}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              aria-label="Reducir tamaño de letra"
            >
              A-
            </button>
            <span className="px-1.5 text-xs font-semibold opacity-80">{tamanoFuente}px</span>
            <button
              type="button"
              onClick={() => setTamanoFuente((t) => Math.min(28, t + 2))}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
              aria-label="Aumentar tamaño de letra"
            >
              A+
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { id: "claro", label: "Claro" },
              { id: "sepia", label: "Sepia" },
              { id: "oscuro", label: "Oscuro" },
            ].map((tema) => (
              <button
                key={tema.id}
                type="button"
                onClick={() => setModoTema(tema.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  modoTema === tema.id
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tema.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-semibold opacity-80">
            Página {paginaSegura + 1} de {totalPaginas} ({progreso}%)
          </span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>

        <article
          className={`mt-5 min-h-60 rounded-2xl border p-5 sm:p-8 leading-relaxed transition-colors ${hojaEstilos}`}
          style={{ fontSize: `${tamanoFuente}px` }}
        >
          <p className="whitespace-pre-line">{lecturaActual.paginas[paginaSegura]}</p>
        </article>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={paginaSegura === 0}
            onClick={() => setPaginaIdx((p) => Math.max(0, p - 1))}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Anterior
          </button>

          <button
            type="button"
            disabled={paginaSegura >= totalPaginas - 1}
            onClick={() => setPaginaIdx((p) => Math.min(totalPaginas - 1, p + 1))}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
            <i className="bi bi-arrow-right ml-2"></i>
          </button>
        </div>
      </div>
    </section>
  );
};

const BibliotecaResumen = () => {
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([
      supabase.from("lector").select("id_lector", { count: "exact", head: true }).eq("estado", "A"),
      supabase.from("libro").select("id_libro", { count: "exact", head: true }).eq("estado", "A"),
      supabase.from("ejemplar").select("id_ejemplar", { count: "exact", head: true }).eq("estado", "A"),
      supabase.from("prestamo").select("id_prestamo", { count: "exact", head: true }).eq("estado", "A"),
      supabase.from("reserva").select("id_reserva", { count: "exact", head: true }),
    ]).then((resultados) => {
      if (!activo) return;
      const fallo = resultados.find((resultado) => resultado.error);
      if (fallo) {
        setError("No se pudieron cargar los indicadores. Verifica la conexión y las políticas de Supabase.");
        return;
      }
      setDatos([
        ["Socios activos", resultados[0].count || 0, "bi-person-badge", "bg-biblioteca-sage text-biblioteca-plum"],
        ["Materiales", resultados[1].count || 0, "bi-journals", "bg-orange-100 text-orange-800"],
        ["Ejemplares", resultados[2].count || 0, "bi-box-seam", "bg-rose-100 text-rose-700"],
        ["Préstamos", resultados[3].count || 0, "bi-arrow-left-right", "bg-purple-100 text-purple-800"],
        ["Reservas", resultados[4].count || 0, "bi-calendar-check", "bg-teal-100 text-teal-800"],
      ]);
    }).catch((e) => activo && setError(e.message));
    return () => { activo = false; };
  }, []);

  return (
    <section>
      {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {datos.map(([titulo, valor, icono, color]) => (
          <article key={titulo} className="dashboard-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm text-slate-500">{titulo}</p>
                <strong className="mt-2 block text-3xl text-slate-900">{valor}</strong>
              </div>
              <span className={`dashboard-icon shrink-0 ${color}`}><i className={`bi ${icono}`} aria-hidden="true"></i></span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const sesion = obtenerSesion();
  const usuario = sesion?.usuario;
  const [vista, setVista] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const temaRol = useMemo(
    () => obtenerTemaPorRol(usuario, sesion?.roles),
    [usuario, sesion?.roles]
  );

  useEffect(() => {
    if (!temaRol.esAdmin && vista === "usuarios") setVista("dashboard");
  }, [temaRol.esAdmin, vista]);

  if (!usuario) return null;

  const entidad = ENTIDADES[vista];
  const tituloCabecera =
    vista === "lector"
      ? "Lector digital"
      : vista === "pagos"
        ? "Métodos de pago"
        : entidad
          ? entidad.titulo
          : "Biblioteca viva";

  const cerrar = () => {
    cerrarSesion();
    navigate("/login", { replace: true });
  };

  const irAVista = (nuevaVista) => {
    setVista(nuevaVista);
    setSidebarOpen(false);
  };
  const menuVisible = temaRol.esAdmin
    ? MENU
    : MENU.filter((item) => item.clave !== "usuarios");

  if (temaRol.esCliente) {
    return <ClientePortal usuario={usuario} onLogout={cerrar} />;
  }

  return (
    <div className="min-h-screen bg-biblioteca-paper">
      {sidebarOpen && (
        <button
          className={`fixed inset-0 z-30 lg:hidden ${temaRol.overlayClase}`}
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 max-w-[85vw] flex-col transition-transform lg:translate-x-0 ${temaRol.asideClase} ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 p-5 sm:p-6">
          <BibliotecaLogo light />
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${temaRol.badgeClase}`}>
            <i className={`bi ${temaRol.esAdmin ? "bi-shield-check" : "bi-person-heart"}`}></i>
            {temaRol.etiquetaRol}
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label="Menú principal">
          <button
            className={vista === "dashboard" ? temaRol.activoClase : "sidebar-item"}
            onClick={() => irAVista("dashboard")}
          >
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </button>

          <button
            className={vista === "lector" ? temaRol.activoClase : "sidebar-item"}
            onClick={() => irAVista("lector")}
          >
            <i className="bi bi-book-reader"></i>
            <span>Lector digital</span>
          </button>

          {menuVisible.map((item) => (
            <button
              key={item.clave}
              className={vista === item.clave ? temaRol.activoClase : "sidebar-item"}
              onClick={() => irAVista(item.clave)}
            >
              <i className={`bi ${item.icono}`}></i>
              <span>{item.nombre}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button onClick={cerrar} className="sidebar-item text-rose-300">
            <i className="bi bi-box-arrow-right"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-3 border-b border-[#e8dfd3] bg-biblioteca-paper/95 px-4 py-3 sm:px-6 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="shrink-0 rounded-xl border border-[#dfd4c5] bg-white p-2 text-slate-800 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <i className="bi bi-list text-lg"></i>
            </button>
            <div className="min-w-0">
              <p className={`truncate text-[10px] font-bold uppercase tracking-[0.2em] ${temaRol.acentoTexto}`}>
                Red de lectura pública · {temaRol.etiquetaRol}
              </p>
              <h1 className="m-0 truncate font-serif text-base sm:text-lg font-bold text-biblioteca-plum">
                {tituloCabecera}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => irAVista("lector")}
              className="hidden items-center gap-1.5 rounded-xl border border-[#dfd4c5] bg-white px-3 py-2 text-xs font-semibold text-biblioteca-plum hover:bg-slate-50 sm:inline-flex"
            >
              <i className="bi bi-book-reader"></i>
              <span>Lector</span>
            </button>
            <div
              title={usuario.nombres || usuario.nombre_usuario || usuario.logeo}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${temaRol.avatarClase}`}
            >
              {String(usuario.nombre_usuario || usuario.logeo || "B").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {vista === "dashboard" ? (
            <>
              <div className="dashboard-welcome mb-6 flex min-h-48 items-center">
                <div className="relative z-10 max-w-xl">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
                    Tu espacio de trabajo · {temaRol.etiquetaRol}
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white">
                    Hola, {usuario.nombres || usuario.nombre_usuario || usuario.logeo || "lector"}.
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-white/75">
                    Una comunidad crece cada vez que alguien encuentra su próximo libro favorito.
                  </p>
                  <button
                    type="button"
                    onClick={() => irAVista("lector")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur hover:bg-white/25"
                  >
                    <i className="bi bi-book-reader"></i>
                    Abrir lector digital
                  </button>
                </div>
                <i className="bi bi-book-half absolute bottom-5 right-10 hidden rotate-[-12deg] text-8xl text-white/10 sm:block" aria-hidden="true"></i>
              </div>

              <BibliotecaResumen />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {MENU.slice(0, 4).map((item) => (
                  <button key={item.clave} onClick={() => irAVista(item.clave)} className="module-card text-left">
                    <span className="module-icon"><i className={`bi ${item.icono}`}></i></span>
                    <strong className="mt-4 block font-serif text-lg text-biblioteca-plum">{item.nombre}</strong>
                    <span className="mt-1 block text-sm text-slate-500">{ENTIDADES[item.clave].descripcion}</span>
                  </button>
                ))}
              </div>
            </>
          ) : vista === "lector" ? (
            <LectorDigital />
          ) : vista === "pagos" ? (
            <MetodosPago />
          ) : (
            <CrudModule entidadKey={vista} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;