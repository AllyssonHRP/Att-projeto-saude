package com.example.Projeto.Saude.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {

    private boolean mfaRequired;
    private Long pacienteId;
}