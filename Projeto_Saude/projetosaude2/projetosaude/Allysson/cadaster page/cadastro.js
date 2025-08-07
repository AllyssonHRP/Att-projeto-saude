document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const paciente = {
            nome: document.getElementById('nome').value,
            nomePai: document.getElementById('nome_pai').value,
            nomeMae: document.getElementById('nome_mae').value,
            dataNascimento: document.getElementById('data_nascimento').value,
            cidade: document.getElementById('cidade_nascimento').value.toUpperCase().replace(/\s/g, ''),
            estadoNascimento: document.getElementById('estado_nascimento').value,
            rg: document.getElementById('rg').value,
            cpf: document.getElementById('cpf').value,
            endereco: document.getElementById('endereco').value,
            cidadeMoradia: document.getElementById('cidade_moradia').value,
            estadoMoradia: document.getElementById('estado_moradia').value,
            email: document.getElementById('email').value,
            password: "defaultPassword123", // Defina uma senha padrão ou adicione um campo de senha
            fone: document.getElementById('fone').value,
            cellPhone: document.getElementById('telefone').value,
            nomeResponsavel: document.getElementById('nome_responsavel').value,
            rgResponsavel: document.getElementById('rg_responsavel').value,
            cpfResponsavel: document.getElementById('cpf_responsavel').value,
        };
        
        // Validação simples do Enum `cidade` antes de enviar
        if (!paciente.cidade) {
            alert('Por favor, preencha a cidade de nascimento.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paciente),
            });

            if (response.ok) {
                alert('Cadastro realizado com sucesso! Você será redirecionado para a página de login.');
                window.location.href = '/projetosaude2/projetosaude/Allysson/login page/login.html';
            } else {
                const errorText = await response.text();
                alert(`Erro no cadastro: ${errorText}`);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    });
});