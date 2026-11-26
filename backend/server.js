const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const catalogoRoutes = require("./routes/catalogoRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());

app.use(express.json());

// Ruta principal
app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "API de la Biblioteca Pública funcionando correctamente."
    });

});

// Rutas de autenticación
app.use("/api/auth", authRoutes);
app.use("/api/catalogo", catalogoRoutes);

// Iniciar servidor
app.listen(PORT, () => {

    console.log(
        `Servidor Biblioteca Pública ejecutándose en http://localhost:${PORT}`
    );

});