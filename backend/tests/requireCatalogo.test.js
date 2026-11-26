const test = require("node:test");
const assert = require("node:assert/strict");

const requireCatalogo = require("../middleware/requireCatalogo");

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

test("allows a session with catalog access", () => {
    const req = { sesion: { modulos: ["CATALOGO"] } };
    const res = crearRespuesta();
    let continuo = false;

    requireCatalogo(req, res, () => { continuo = true; });

    assert.equal(continuo, true);
    assert.equal(res.statusCode, null);
});

test("rejects sessions without catalog access", () => {
    const req = { sesion: { modulos: ["SOCIOS"] } };
    const res = crearRespuesta();

    requireCatalogo(req, res, () => assert.fail("catalog access must be required"));

    assert.equal(res.statusCode, 403);
    assert.equal(res.contenido.success, false);
});
