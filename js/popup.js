const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');


// Funzione per aggiungere un messaggio alla cronologia della chat
function addMessage(sender, message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (sender === 'You') {
        messageElement.classList.add('user-message');
    } else if (sender === 'AI') {
        messageElement.classList.add('ai-message');
    }

    messageElement.textContent = message;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight; // Scroll to bottom
}



// Funzione per mostrare/nascondere il loader
function toggleLoader(show) {
    const existingLoader = chatHistory.querySelector('.loader');
    if (show && !existingLoader) {
        const loader = document.createElement('div');
        loader.classList.add('loader');
        chatHistory.appendChild(loader);
    } else if (!show && existingLoader) {
        existingLoader.remove();
    }
}

// Invia un messaggio al background script
async function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        const { selectedModel } = await chrome.storage.sync.get('selectedModel');
        if (!selectedModel) {
            addMessage('System', 'Per favore, seleziona un modello nelle opzioni.');
            return;
        }
        addMessage('You', message);
        chatInput.value = '';
        toggleLoader(true);
        
        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'chat_message', message, model: selectedModel }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });
            addMessage('AI', response.reply);
        } catch (error) {
            console.error(error);
            addMessage('System', `Errore: ${error.message}`);
        } finally {
            toggleLoader(false);
        }
    }
}

sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
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

// Carica la cronologia e i modelli all'apertura del popup
document.addEventListener('DOMContentLoaded', () => {
    const optionsButton = document.getElementById('options-button');

    optionsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Controlla se c'è testo selezionato da caricare
    chrome.storage.local.get('selectedTextForPopup', function(data) {
        if (data.selectedTextForPopup) {
            chatInput.value = `"${data.selectedTextForPopup}"\n\n`;
            chatInput.focus();
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            // Pulisci il testo dopo averlo usato
            chrome.storage.local.remove('selectedTextForPopup');
        }
    });

    loadChatHistory();
    sendButton.innerHTML = '&#10148;'; // Usa un'entità HTML per la freccia
});