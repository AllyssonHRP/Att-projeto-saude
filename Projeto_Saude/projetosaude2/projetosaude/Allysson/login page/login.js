document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('usuario').value;
        const password = document.getElementById('senha_usuario').value;

        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            if (response.ok) {
                // Salva o ID do paciente para usar depois
                localStorage.setItem('pacienteId', result.pacienteId);

                if (result.mfaRequired) {
                    // Redireciona para a página de verificação 2FA
                    window.location.href = '/projetosaude2/projetosaude/Allysson/2fa/2fa.html'; 
                } else {
                    // Redireciona para o dashboard
                    window.location.href = '/projetosaude2/projetosaude/Allysson/dashboard/dashboard.html';
                }
            } else {
                alert(`Erro no login: ${result.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    });
});