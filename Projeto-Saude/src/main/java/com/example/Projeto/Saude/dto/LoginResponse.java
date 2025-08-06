package com.example.Projeto.Saude.dto;

import com.example.Projeto.Saude.security.AuthController;
import lombok.AllArgsConstructor;
import lombok.Data;

// @Data para getters e setters
// @AllArgsConstructor para criar um construtor com todos os argumentos
@Data
@AllArgsConstructor
public class LoginResponse extends AuthController {

    private boolean mfaRequired;
    private Long pacienteId;


}