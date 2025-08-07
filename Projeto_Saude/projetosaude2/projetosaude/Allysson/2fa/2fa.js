document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('2fa-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const pacienteId = localStorage.getItem('pacienteId');
        if (!pacienteId) {
            alert('Sessão inválida. Faça o login novamente.');
            window.location.href = '';
            return;
        }

        const code = document.getElementById('code').value;

        try {
            const response = await fetch(`http://localhost:8080/api/auth/mfa/verify?pacienteId=${pacienteId}&code=${code}`, {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                alert('Código inválido. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao verificar o código 2FA.');
        }
    });
});