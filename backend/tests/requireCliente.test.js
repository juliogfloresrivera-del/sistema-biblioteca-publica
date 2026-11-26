const test = require("node:test");
const assert = require("node:assert/strict");

const requireCliente = require("../middleware/requireCliente");

const crearRespuesta = () => ({
    statusCode: null,
    contenido: null,
    status(codigo) {
        this.statusCode = codigo;
        return this;
    },
    json(contenido) {
        this.contenido = contenido;
        return this;
    }
});

test("allows a client role to enter the client portal", () => {
    const req = { sesion: { roles: ["SOCIO / CLIENTE"] } };
    const res = crearRespuesta();
    let continuo = false;

    requireCliente(req, res, () => { continuo = true; });

    assert.equal(continuo, true);
    assert.equal(res.statusCode, null);
});

test("rejects administrator and mixed-role sessions from the client portal", () => {
    for (const roles of [["ADMINISTRADOR"], ["CLIENTE", "ADMINISTRADOR"], []]) {
        const res = crearRespuesta();
        requireCliente({ sesion: { roles } }, res, () => assert.fail("client role must be required"));
        assert.equal(res.statusCode, 403);
    }
});
