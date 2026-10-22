package com.biblioteca.controller;

import com.biblioteca.model.Usuario;
import com.biblioteca.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("nombreUsuario");
        String password = credentials.get("clave");

        Optional<Usuario> usuarioOpt = usuarioRepository.findByNombreUsuario(username);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            if (passwordEncoder.matches(password, usuario.getClaveHash())) {
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Login exitoso",
                    "nombres", usuario.getNombres(),
                    "correo", usuario.getCorreo()
                ));
            }
        }
        return ResponseEntity.status(401).body(Map.of("error", "Credenciales inválidas"));
    }
}