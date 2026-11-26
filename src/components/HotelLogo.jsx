const HotelLogo = ({ light = false }) => {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          light ? "bg-white/10" : "bg-biblioteca-coral"
        }`}
      >
        <i
          className={`bi bi-building text-2xl ${
            light ? "text-white" : "text-biblioteca-plum"
          }`}
        ></i>
      </div>

      <div>
        <h1
          className={`m-0 font-serif text-xl font-bold ${
            light ? "text-white" : "text-biblioteca-plum"
          }`}
        >
         <span>
             BIBLIOTECA PÚBLICA
         </span>
        </h1>

        <p
          className={`m-0 text-xs tracking-[0.25em] ${
            light ? "text-white/70" : "text-gray-500"
          }`}
        >
         <span>
             RED DE LECTURA PÚBLICA
         </span>
        </p>
      </div>
    </div>
  );
};

export default HotelLogo;