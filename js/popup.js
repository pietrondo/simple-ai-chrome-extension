const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const modelSelector = document.getElementById('model-selector');

// Funzione per aggiungere un messaggio alla cronologia della chat
function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    const senderElement = document.createElement('strong');
    senderElement.textContent = `${sender}: `;
    messageElement.appendChild(senderElement);

    const messageText = document.createTextNode(message);
    messageElement.appendChild(messageText);

    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to bottom
}

// Carica i modelli da OpenRouter
async function loadModels() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        data.data.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            modelSelector.appendChild(option);
        });
    } catch (error) {
        console.error('Errore nel caricamento dei modelli:', error);
        addMessage('System', 'Errore nel caricamento dei modelli da OpenRouter.');
    }
}

// Invia un messaggio al background script
function sendMessage() {
  const message = chatInput.value.trim();
  const selectedModel = modelSelector.value;
  if (message) {
    addMessage('You', message);
    chrome.runtime.sendMessage({ type: 'chat_message', message, model: selectedModel }, (response) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            addMessage('System', `Errore: ${chrome.runtime.lastError.message}`);
        } else {
            addMessage('AI', response.reply);
        }
    });
    chatInput.value = '';
  }
}

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Funzione per caricare e visualizzare la cronologia
async function loadChatHistory() {
    const { chatHistory: storedHistory = [] } = await chrome.storage.local.get('chatHistory');
    chatHistory.innerHTML = ''; // Pulisce la vista attuale
    storedHistory.forEach(item => addMessage(item.sender, item.message));
}

// Aggiorna la chat quando i dati cambiano
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.chatHistory) {
        loadChatHistory();
    }
});

// Carica la cronologia all'apertura del popup
loadChatHistory();

// Carica i modelli all'avvio
loadModels();