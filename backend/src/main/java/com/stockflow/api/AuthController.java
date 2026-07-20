package com.stockflow.api;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth")
class AuthController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    AuthController(UserRepository users, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    ResponseEntity<Map<String, Object>> register(@RequestBody AuthRequest request) {
        if (request.username == null || request.username.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        if (request.password == null || request.password.length() < 4)
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 4 characters"));
        if (users.existsByUsername(request.username))
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));

        User user = new User(request.username, passwordEncoder.encode(request.password),
                request.displayName != null ? request.displayName : request.username);
        users.save(user);

        String token = jwtUtil.generateToken(user.id, user.username);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "token", token,
            "user", Map.of("id", user.id, "username", user.username, "displayName", user.displayName, "theme", user.theme)
        ));
    }

    @PostMapping("/login")
    ResponseEntity<Map<String, Object>> login(@RequestBody AuthRequest request) {
        if (request.username == null || request.password == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password required"));

        User user = users.findByUsername(request.username).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password, user.password))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));

        String token = jwtUtil.generateToken(user.id, user.username);
        return ResponseEntity.ok(Map.of(
            "token", token,
            "user", Map.of("id", user.id, "username", user.username, "displayName", user.displayName)
        ));
    }

    @GetMapping("/me")
    ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(Map.of(
            "id", user.id, "username", user.username, "displayName", user.displayName,
            "theme", user.theme
        ));
    }

    @PutMapping("/theme")
    ResponseEntity<Map<String, Object>> updateTheme(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        String theme = body.get("theme");
        if (theme == null || (!theme.equals("dark") && !theme.equals("light")))
            return ResponseEntity.badRequest().body(Map.of("error", "Theme must be 'dark' or 'light'"));
        user.theme = theme;
        users.save(user);
        return ResponseEntity.ok(Map.of("theme", theme));
    }

    @GetMapping("/theme")
    ResponseEntity<Map<String, Object>> getTheme(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        return ResponseEntity.ok(Map.of("theme", user.theme));
    }

    record AuthRequest(String username, String password, String displayName) {}
}
