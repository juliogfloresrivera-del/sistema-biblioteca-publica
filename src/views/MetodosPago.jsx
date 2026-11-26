import { useState } from "react";

const numeroYape = (process.env.REACT_APP_YAPE_NUMERO || "").trim();
const titularYape = (process.env.REACT_APP_YAPE_TITULAR || "").trim();
const proveedorTarjeta = (process.env.REACT_APP_TARJETA_PROVEEDOR || "").trim();

const MetodosPago = () => {
  const [metodo, setMetodo] = useState("");

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm text-slate-600">
          Elige una opción para consultar su configuración. Esta pantalla no registra ni confirma pagos.
        </p>
        <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Los cobros en línea permanecerán deshabilitados hasta integrar y probar una pasarela en el backend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          type="button"
          aria-pressed={metodo === "yape"}
          onClick={() => setMetodo("yape")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            metodo === "yape"
              ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
              : "border-slate-200 bg-white hover:border-purple-300"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-xl text-purple-700">
              <i className="bi bi-phone" aria-hidden="true"></i>
            </span>
            <span>
              <strong className="block text-lg text-slate-900">Yape</strong>
              <span className="text-sm text-slate-500">Pago móvil</span>
            </span>
          </span>
          {metodo === "yape" && (
            <span className="mt-4 block border-t border-purple-200 pt-4 text-sm text-slate-700">
              {numeroYape ? (
                <>
                  <span className="block">Número: <strong>{numeroYape}</strong></span>
                  {titularYape && <span className="mt-1 block">Titular: {titularYape}</span>}
                </>
              ) : (
                <span>Configura REACT_APP_YAPE_NUMERO y REACT_APP_YAPE_TITULAR en el entorno del frontend.</span>
              )}
              <span className="mt-3 block text-xs text-amber-800">
                La confirmación del pago debe hacerse fuera del sistema hasta integrar la verificación con el proveedor.
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          aria-pressed={metodo === "tarjeta"}
          onClick={() => setMetodo("tarjeta")}
          className={`rounded-2xl border p-5 text-left shadow-sm transition ${
            metodo === "tarjeta"
              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
              : "border-slate-200 bg-white hover:border-blue-300"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl text-blue-700">
              <i className="bi bi-credit-card" aria-hidden="true"></i>
            </span>
            <span>
              <strong className="block text-lg text-slate-900">Tarjeta</strong>
              <span className="text-sm text-slate-500">Crédito o débito</span>
            </span>
          </span>
          {metodo === "tarjeta" && (
            <span className="mt-4 block border-t border-blue-200 pt-4 text-sm text-slate-700">
              {proveedorTarjeta
                ? `Proveedor configurado: ${proveedorTarjeta}. La integración del cobro en el backend aún está pendiente.`
                : "Selecciona un proveedor de pago antes de publicar esta opción."}
              <span className="mt-3 block text-xs text-amber-800">
                No ingreses ni almacenes datos de tarjeta en esta aplicación.
              </span>
            </span>
          )}
        </button>
      </div>
    </section>
  );
};

export default MetodosPago;
