package com.example.Projeto.Saude.security;

import com.example.Projeto.Saude.dto.LoginRequest;
import com.example.Projeto.Saude.dto.LoginResponse;
import com.example.Projeto.Saude.entity.Paciente;
import com.example.Projeto.Saude.repository.PacienteRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController extends com.example.Projeto.Saude.dto.LoginRequest {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private CodeVerifier codeVerifier;


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Paciente paciente) {
        if (pacienteRepository.findByEmail(paciente.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email já cadastrado.");
        }
        paciente.setPassword(passwordEncoder.encode(paciente.getPassword()));
        paciente.setMfaEnabled(false); // 2FA começa desabilitado
        Paciente savedPaciente = pacienteRepository.save(paciente);
        return ResponseEntity.ok(savedPaciente);
    }

    // NOVO: Endpoint de Login (Etapa 1: Senha)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Paciente paciente = pacienteRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado."));

        if (passwordEncoder.matches(loginRequest.getPassword(), paciente.getPassword())) {
            if (paciente.isMfaEnabled()) {
                // Se 2FA estiver ativo, informe o frontend para pedir o código
                return ResponseEntity.ok(new LoginResponse(true, paciente.getId()));
            } else {
                // Login bem-sucedido sem 2FA
                return ResponseEntity.ok(new LoginResponse(false, paciente.getId()));
            }
        }
        return ResponseEntity.badRequest().body("Email ou senha inválidos.");
    }
    
    @PostMapping("/mfa/setup")
    public ResponseEntity<?> setupDevice(@RequestParam Long pacienteId) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado."));

        // Gera o segredo e o QR Code
        DefaultSecretGenerator secretGenerator = new DefaultSecretGenerator();
        String secret = secretGenerator.generate();
        paciente.setSecret(secret);
        pacienteRepository.save(paciente);

        QrData data = new QrData.Builder()
                .label(paciente.getEmail())
                .secret(secret)
                .issuer("Projeto Saude")
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        // Gera a imagem do QR Code
        QrGenerator generator = new ZxingPngQrGenerator();
        byte[] imageData;
        try {
            imageData = generator.generate(data);
        } catch (Exception e) {
            log.error("Erro ao gerar QR Code", e);
            return ResponseEntity.internalServerError().body("Erro ao gerar QR Code.");
        }
        
        // Retorna a imagem como uma string base64
        return ResponseEntity.ok().body(getDataUriForImage(imageData, generator.getImageMimeType()));
    }


    @PostMapping("/mfa/verify")
    public ResponseEntity<?> verify(@RequestParam Long pacienteId, @RequestParam String code) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado."));

        if (codeVerifier.isValidCode(paciente.getSecret(), code)) {
            if (!paciente.isMfaEnabled()) {
                paciente.setMfaEnabled(true);
                pacienteRepository.save(paciente);
            }
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.badRequest().body("Código inválido.");
    }

}


@Data
public class LoginRequest {
    private String email;
    private String password;

    public String getEmail() {
    }
}

package com.example.Projeto.Saude.dto.LoginResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private boolean mfaRequired;
    private Long pacienteId;
}