package com.example.Projeto.Saude.dto;

import lombok.Data;

// A anotação @Data do Lombok gera automaticamente os getters, setters, toString, etc.
@Data
public class LoginRequest {

    private String email;
    private String password;

}
