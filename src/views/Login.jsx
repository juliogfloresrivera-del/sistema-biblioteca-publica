import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { ejecutarLogin, validarLogin } from "../controllers/authController";
import { guardarSesion, obtenerSesion } from "../services/authSession";

const SOCIO_INICIAL = {
  dni: "",
  nombres: "",
  apellidos: "",
  fecha_nacimiento: "",
  celular: "",
  direccion: "",
  referencia: "",
};

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ logeo: "", clave: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [pasoRegistro, setPasoRegistro] = useState(1);
  const [socioForm, setSocioForm] = useState(SOCIO_INICIAL);
  const [errorRegistro, setErrorRegistro] = useState("");
  const [exitoRegistro, setExitoRegistro] = useState("");
  const [guardandoSocio, setGuardandoSocio] = useState(false);

  useEffect(() => {
    if (obtenerSesion()) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const cambiar = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  const enviar = async (event) => {
    event.preventDefault();
    const validacion = validarLogin(formData.logeo, formData.clave);
    if (!validacion.success) return setErrors(validacion.errors);
    setErrors({});
    setLoading(true);

    try {
      const resultado = await ejecutarLogin(formData.logeo, formData.clave);
      setLoading(false);
      if (!resultado?.success) {
        return setErrors({
          general: resultado?.message || "Usuario o contraseña incorrectos.",
        });
      }
      guardarSesion(resultado, true);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setLoading(false);
      setErrors({
        general: error?.message || "No se pudo conectar con el servicio de inicio de sesión.",
      });
    }
  };

  const abrirModalRegistro = () => {
    setSocioForm(SOCIO_INICIAL);
    setPasoRegistro(1);
    setErrorRegistro("");
    setExitoRegistro("");
    setMostrarRegistro(true);
  };

  const cambiarSocio = (event) => {
    const { name, value } = event.target;
    setSocioForm((prev) => ({ ...prev, [name]: value }));
    setErrorRegistro("");
  };

  const continuarDesdeDni = () => {
    const dniLimpio = socioForm.dni.replace(/\D/g, "").slice(0, 8);
    if (dniLimpio.length !== 8) {
      setErrorRegistro("Ingresa un DNI válido de 8 dígitos para continuar.");
      return;
    }
    setSocioForm((prev) => ({ ...prev, dni: dniLimpio }));
    setErrorRegistro("");
    setPasoRegistro(2);
  };

  const continuarDesdeDatos = () => {
    if (!socioForm.nombres.trim() || !socioForm.apellidos.trim()) {
      setErrorRegistro("Completa nombres y apellidos.");
      return;
    }
    setErrorRegistro("");
    setPasoRegistro(3);
  };

  const registrarSocio = async (event) => {
    event.preventDefault();
    if (!socioForm.direccion.trim()) {
      setErrorRegistro("Ingresa la dirección exacta.");
      return;
    }
    setGuardandoSocio(true);
    setErrorRegistro("");

    const apellidos = socioForm.apellidos.trim().split(/\s+/);
    const payloadLector = {
      codigo_carnet: `LEC-${socioForm.dni}`,
      nombres: socioForm.nombres.trim(),
      apellido_paterno: apellidos.shift(),
      apellido_materno: apellidos.join(" ") || null,
      fecha_nacimiento: socioForm.fecha_nacimiento || null,
      telefono: socioForm.celular.trim() || null,
      direccion: [
        socioForm.direccion.trim(),
        socioForm.referencia.trim() ? `Referencia: ${socioForm.referencia.trim()}` : "",
      ].filter(Boolean).join(" · ") || null,
      fecha_registro: new Date().toISOString().slice(0, 10),
      estado: "A",
    };

    try {
      const { error } = await supabase.from("lector").insert([payloadLector]);
      if (error) throw error;

      setExitoRegistro(`Lector con carnet ${payloadLector.codigo_carnet} registrado correctamente.`);
      setTimeout(() => {
        setMostrarRegistro(false);
        setPasoRegistro(1);
        setSocioForm(SOCIO_INICIAL);
      }, 1400);
    } catch (err) {
      setErrorRegistro(err.message || "No se pudo registrar al socio.");
    } finally {
      setGuardandoSocio(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden flex-col items-center justify-center border-r-4 border-[#f97316] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-10 text-center text-white lg:flex">
          <div className="max-w-md">
            <img
              src="/LOGO BIBLIOTECH.png"
              alt="BiblioTech Logo"
              className="mx-auto mb-6 max-h-44 rounded-2xl bg-white p-4 shadow-xl"
            />
            <p className="text-xl font-semibold text-white">
              Sistema Integral de Gestión de Biblioteca Física
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Control de préstamos físicos, devoluciones, socios y tarifas virtuales.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <img
                src="/LOGO BIBLIOTECH.png"
                alt="BiblioTech Logo"
                className="mx-auto mb-3 max-h-24 rounded-xl bg-white p-2 shadow"
              />
            </div>

            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900">Bienvenido a BiblioTech</h1>
              <p className="mt-1 text-sm text-slate-500">Ingresa tus datos para iniciar sesión.</p>
            </div>

            <form onSubmit={enviar} noValidate className="space-y-4">
              {errors.general && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
                  {errors.general}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Usuario o Correo
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-[#f97316]">
                  <i className="bi bi-person-fill mr-2 text-slate-400"></i>
                  <input
                    type="text"
                    name="logeo"
                    value={formData.logeo}
                    onChange={cambiar}
                    placeholder="Ingresa tu usuario o correo"
                    className="w-full py-2.5 text-sm text-slate-800 outline-none"
                  />
                </div>
                {errors.logeo && <p className="mt-1 text-xs text-rose-600">{errors.logeo}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Contraseña
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 bg-white px-3 focus-within:border-[#f97316]">
                  <i className="bi bi-lock-fill mr-2 text-slate-400"></i>
                  <input
                    type="password"
                    name="clave"
                    value={formData.clave}
                    onChange={cambiar}
                    placeholder="Ingresa tu contraseña"
                    className="w-full py-2.5 text-sm text-slate-800 outline-none"
                  />
                </div>
                {errors.clave && <p className="mt-1 text-xs text-rose-600">{errors.clave}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#f97316] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#ea580c] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                    Ingresando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i>
                    Ingresar al Sistema
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5 text-center">
              <p className="mb-2 text-xs text-slate-500">¿No tienes cuenta de socio?</p>
              <button
                type="button"
                onClick={abrirModalRegistro}
                className="w-full rounded-lg border border-slate-800 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-900 hover:text-white"
              >
                <i className="bi bi-person-plus-fill mr-1.5"></i>
                Registrarse como Cliente / Socio
              </button>
            </div>
          </div>
        </section>
      </div>

      {mostrarRegistro && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Registro de socio"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">
                    Paso {pasoRegistro} de 3 · Registro de lector
                </p>
                <h2 className="text-xl font-bold text-slate-900">
                  {pasoRegistro === 1 && "1. Verifica tu DNI primero"}
                  {pasoRegistro === 2 && "2. Datos personales"}
                  {pasoRegistro === 3 && "3. Dirección"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMostrarRegistro(false)}
                aria-label="Cerrar registro"
                className="rounded-lg px-2.5 py-1 text-slate-500 hover:bg-slate-100"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {errorRegistro && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {errorRegistro}
              </div>
            )}

            {exitoRegistro && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                {exitoRegistro}
              </div>
            )}

            <form onSubmit={registrarSocio} className="mt-4 space-y-4">
              {pasoRegistro === 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Número de DNI (8 dígitos) *
                  </label>
                  <input
                    type="text"
                    name="dni"
                    maxLength={8}
                    value={socioForm.dni}
                    onChange={cambiarSocio}
                    placeholder="Ej. 74829102"
                    inputMode="numeric"
                    autoComplete="off"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#f97316]"
                  />
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setMostrarRegistro(false)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={continuarDesdeDni}
                      className="rounded-xl bg-[#f97316] px-5 py-2 text-xs font-semibold text-white hover:bg-[#ea580c]"
                    >
                      Continuar con DNI <i className="bi bi-arrow-right ml-1"></i>
                    </button>
                  </div>
                </div>
              )}

              {pasoRegistro === 2 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Nombres *</label>
                    <input
                      type="text"
                      name="nombres"
                      value={socioForm.nombres}
                      onChange={cambiarSocio}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Apellidos *</label>
                    <input
                      type="text"
                      name="apellidos"
                      value={socioForm.apellidos}
                      onChange={cambiarSocio}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Fecha de nacimiento</label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={socioForm.fecha_nacimiento}
                      onChange={cambiarSocio}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Celular</label>
                    <input
                      type="text"
                      name="celular"
                      value={socioForm.celular}
                      onChange={cambiarSocio}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-3 flex justify-between gap-2 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setPasoRegistro(1)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <i className="bi bi-arrow-left mr-1"></i> Atrás (DNI)
                    </button>
                    <button
                      type="button"
                      onClick={continuarDesdeDatos}
                      className="rounded-xl bg-[#f97316] px-5 py-2 text-xs font-semibold text-white hover:bg-[#ea580c]"
                    >
                      Siguiente: Dirección <i className="bi bi-arrow-right ml-1"></i>
                    </button>
                  </div>
                </div>
              )}

              {pasoRegistro === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Dirección exacta *</label>
                    <input
                      type="text"
                      name="direccion"
                      value={socioForm.direccion}
                      onChange={cambiarSocio}
                      placeholder="Ej. Av. San Martín 450, Ica"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Referencia de dirección</label>
                    <textarea
                      name="referencia"
                      rows="2"
                      value={socioForm.referencia}
                      onChange={cambiarSocio}
                      placeholder="Ej. Cerca al óvalo principal, frente a la farmacia"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="mt-4 flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPasoRegistro(2)}
                      className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <i className="bi bi-arrow-left mr-1"></i> Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={guardandoSocio}
                      className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {guardandoSocio ? "Guardando..." : "Finalizar registro"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Login;