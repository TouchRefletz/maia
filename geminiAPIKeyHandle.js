// Referências aos elementos do DOM
const modal = document.getElementById('apiKeyModal');
const input = document.getElementById('apiKeyInput');
const saveBtn = document.getElementById('saveApiKeyBtn');
const errorMsg = document.getElementById('apiError');
const form = document.getElementById('apiKeyForm'); // Referência direta ao formulário

// 1. Tenta pegar a chave do Session Storage
let apiKey = sessionStorage.getItem("GOOGLE_GENAI_API_KEY");

// 2. CORREÇÃO PRINCIPAL: Verifica se a chave veio pela URL (após o reload)
const urlParams = new URLSearchParams(window.location.search);
const urlKey = urlParams.get('apiKey');

if (urlKey) {
    // Se achou na URL, salva e usa ela
    apiKey = urlKey;
    sessionStorage.setItem("GOOGLE_GENAI_API_KEY", apiKey);
    
    // Limpa a URL para remover a chave visível (fica mais limpo)
    window.history.replaceState({}, document.title, window.location.pathname);
}

// Função para validar e salvar (usada no click e no submit)
function saveKey() {
    const key = input.value.trim();
    if (key.length > 10) { // Validação básica
        sessionStorage.setItem("GOOGLE_GENAI_API_KEY", key);
        apiKey = key;

        // Esconde o modal e libera o site
        modal.classList.add('hidden');
        
        // Opcional: Recarregar para garantir que outros scripts peguem a nova chave
        // window.location.reload(); 
    } else {
        errorMsg.classList.remove('hidden');
        input.style.borderColor = 'var(--color-error)';
        input.focus();
    }
}

// Lógica de Inicialização
if (!apiKey || apiKey === "null") {
    // Se não tem chave, mostra o modal
    if (modal) {
        modal.classList.remove('hidden');
        if(input) input.focus();
    }
} else {
    // Se já tem chave, garante que o modal esteja escondido
    if (modal) modal.classList.add('hidden');
}

// Configuração dos Event Listeners
if (form) {
    // Prioridade: Ouvir o submit do formulário para evitar reload
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede o recarregamento da página
        saveKey();
    });
} else if (saveBtn) {
    // Fallback caso o formulário não seja encontrado
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Garante que botão type="submit" não recarregue
        saveKey();
    });
}

if (input) {
    // Remove erro ao digitar
    input.addEventListener('input', () => {
        errorMsg.classList.add('hidden');
        input.style.borderColor = '';
    });
}

// Bloqueia o fechamento com ESC se não tiver chave
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (!apiKey || apiKey === "null")) {
        e.preventDefault();
        if(input) input.focus();
    }
});

export default apiKey;
