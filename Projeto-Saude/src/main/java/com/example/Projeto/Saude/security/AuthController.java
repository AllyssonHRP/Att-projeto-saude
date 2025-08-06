package com.example.Projeto.Saude.controller;

import com.example.Projeto.Saude.entity.Paciente;
import com.example.Projeto.Saude.repository.PacienteRepository;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import static dev.samstevens.totp.util.Utils.getDataUriForImage;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Paciente paciente) {
        // Codifica a senha antes de salvar
        paciente.setPassword(passwordEncoder.encode(paciente.getPassword()));
        pacienteRepository.save(paciente);
        return ResponseEntity.ok("Paciente registrado com sucesso!");
    }

    // Endpoint para gerar o QR Code para o usuário ativar o 2FA
    @PostMapping("/mfa/setup")
    public ResponseEntity<?> setupDevice(@RequestParam Long pacienteId) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado."));

        SecretGenerator secretGenerator = new DefaultSecretGenerator();
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

        QrGenerator generator = new ZxingPngQrGenerator();
        byte[] imageData;
        try {
            imageData = generator.generate(data);
        } catch (Exception e) {
            log.error("Erro ao gerar QR Code", e);
            return ResponseEntity.internalServerError().body("Erro ao gerar QR Code.");
        }

        String qrCodeImage = getDataUriForImage(imageData, generator.getImageMimeType());

        // Retorna a imagem do QR Code para o frontend
        return ResponseEntity.ok().body(qrCodeImage);
    }

    // Endpoint para verificar o código e ativar o 2FA
    @PostMapping("/mfa/verify")
    public ResponseEntity<?> verify(@RequestParam Long pacienteId, @RequestParam String code) {
        Paciente paciente = pacienteRepository.findById(pacienteId)
                .orElseThrow(() -> new RuntimeException("Paciente não encontrado."));

        TimeProvider timeProvider = new SystemTimeProvider();
        CodeGenerator codeGenerator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);

        if (verifier.isValidCode(paciente.getSecret(), code)) {
            paciente.setMfaEnabled(true);
            pacienteRepository.save(paciente);
            return ResponseEntity.ok("2FA ativado com sucesso!");
        }

        return ResponseEntity.badRequest().body("Código inválido.");
    }

}