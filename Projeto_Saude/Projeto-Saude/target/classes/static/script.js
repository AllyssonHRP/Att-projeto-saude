document.addEventListener("DOMContentLoaded", () => {
    // Esconder todas as seções exceto a de registro por padrão
    showSection('register-section');

    // Formulários
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('mfa-verify-form').addEventListener('submit', handleMfaVerify);
    document.getElementById('mfa-login-form').addEventListener('submit', handleMfaLogin);
    document.getElementById('setup-mfa-button').addEventListener('click', handleMfaSetup);
});

let currentPacienteId = null;

// Função para mostrar a seção correta e esconder as outras
function showSection(sectionId) {
    document.querySelectorAll('.container > div').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    clearMessages();
}

function displayMessage(message, isError = false) {
    const messagesDiv = isError ? document.getElementById('error-messages') : document.getElementById('messages');
    messagesDiv.textContent = message;
}

function clearMessages() {
    document.getElementById('messages').textContent = '';
    document.getElementById('error-messages').textContent = '';
}

// 1. REGISTRO
async function handleRegister(e) {
    e.preventDefault();
    clearMessages();
    const nome = document.getElementById('register-nome').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, password })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        
        const data = await response.json();
        currentPacienteId = data.id;
        displayMessage('Registro bem-sucedido! Faça o login para continuar.');
        showSection('login-section');

    } catch (error) {
        displayMessage(`Erro no registro: ${error.message}`, true);
    }
}

// 2. LOGIN - ETAPA 1
async function handleLogin(e) {
    e.preventDefault();
    clearMessages();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const data = await response.json();
        currentPacienteId = data.pacienteId;

        if (data.mfaRequired) {
            // Requer 2FA
            showSection('mfa-login-section');
        } else {
            // Login direto
            showSuccessPage();
        }
    } catch (error) {
        displayMessage(`Erro no login: ${error.message}`, true);
    }
}

// 3. ATIVAÇÃO DO 2FA
async function handleMfaSetup() {
    clearMessages();
    try {
        const response = await fetch(`/api/auth/mfa/setup?pacienteId=${currentPacienteId}`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Falha ao iniciar a configuração do 2FA.');

        const qrCodeDataUri = await response.text();
        document.getElementById('qrCode').innerHTML = `<img src="${qrCodeDataUri}" alt="QR Code">`;
        showSection('mfa-setup-section');
    } catch (error) {
        displayMessage(`Erro: ${error.message}`, true);
    }
}

// 4. VERIFICAÇÃO DO CÓDIGO (para ativar o 2FA)
async function handleMfaVerify(e) {
    e.preventDefault();
    clearMessages();
    const code = document.getElementById('mfa-code').value;

    try {
        const response = await fetch(`/api/auth/mfa/verify?pacienteId=${currentPacienteId}&code=${code}`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Código de verificação inválido.');

        displayMessage('2FA ativado com sucesso!');
        showSuccessPage();
        
    } catch (error) {
        displayMessage(`Erro na verificação: ${error.message}`, true);
    }
}

// 5. LOGIN - ETAPA 2 (Verificar código 2FA)
async function handleMfaLogin(e) {
    e.preventDefault();
    clearMessages();
    const code = document.getElementById('mfa-login-code').value;
    
    try {
         const response = await fetch(`/api/auth/mfa/verify?pacienteId=${currentPacienteId}&code=${code}`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error('Código de verificação inválido.');
        
        showSuccessPage();

    } catch(error) {
        displayMessage(`Erro na verificação do login: ${error.message}`, true);
    }
}


function showSuccessPage() {
    showSection('success-section');
    document.getElementById('welcome-message').textContent = `Bem-vindo, Paciente ID: ${currentPacienteId}`;
}

function logout() {
    currentPacienteId = null;
    document.getElementById('register-form').reset();
    document.getElementById('login-form').reset();
    document.getElementById('mfa-verify-form').reset();
    document.getElementById('mfa-login-form').reset();
    showSection('register-section');
}