const BibliotecaLogo = ({ light = false }) => (
  <div className="flex items-center gap-3">
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${light ? "bg-white/10" : "bg-biblioteca-coral"}`}>
      <i className={`bi bi-book-half text-2xl ${light ? "text-biblioteca-coral" : "text-white"}`} aria-hidden="true"></i>
    </div>
    <div>
      <h1 className={`m-0 font-serif text-xl font-bold ${light ? "text-white" : "text-biblioteca-plum"}`}>
        Biblioteca Pública
      </h1>
      <p className={`m-0 text-[10px] tracking-[0.22em] ${light ? "text-white/60" : "text-slate-500"}`}>
        RED DE LECTURA PÚBLICA
      </p>
    </div>
  </div>
);

export default BibliotecaLogo;
