const esRolCliente = (nombreRol) => {
    const nombre = String(nombreRol || "").trim().toUpperCase();
    return nombre === "USUARIO" ||
        /(?:^|[\s/_-])(CLIENTE|SOCIO|LECTOR)(?:$|[\s/_-])/.test(nombre);
};

module.exports = { esRolCliente };
