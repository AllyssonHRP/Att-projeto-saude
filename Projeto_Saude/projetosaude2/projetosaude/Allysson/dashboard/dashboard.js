document.addEventListener('DOMContentLoaded', () => {
    const pacienteId = localStorage.getItem('pacienteId');
    if (!pacienteId) {
        window.location.href = '/projetosaude2/projetosaude/Allysson/login page/login.html';
        return;
    }

    document.getElementById('setup-mfa-button').addEventListener('click', async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/auth/mfa/setup?pacienteId=${pacienteId}`, {
                method: 'POST'
            });
            const qrCodeDataUri = await response.text();
            document.getElementById('qr-code-image').src = qrCodeDataUri;
            document.getElementById('qr-code-container').style.display = 'block';
        } catch (error) {
            alert('Erro ao gerar QR Code.');
        }
    });

    document.getElementById('verify-mfa-button').addEventListener('click', async () => {
        const code = document.getElementById('mfa-code').value;
        try {
            const response = await fetch(`http://localhost:8080/api/auth/mfa/verify?pacienteId=${pacienteId}&code=${code}`, {
                method: 'POST'
            });
            if (response.ok) {
                alert('2FA ativado com sucesso!');
                document.getElementById('mfa-activation').innerHTML = '<p>2FA já está ativo.</p>';
            } else {
                alert('Código inválido.');
            }
        } catch (error) {
            alert('Erro ao verificar o código.');
        }
    });
});

function logout() {
    localStorage.removeItem('pacienteId');
    window.location.href = '/projetosaude2/projetosaude/Allysson/login page/login.html';
}