document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('save-api-key');
    const saveModelButton = document.getElementById('save-model');
    const modelSelector = document.getElementById('model-selector');
    const status = document.getElementById('status');

    // Funzione per mostrare i messaggi di stato
    function showStatus(message, isError = false) {
        status.textContent = message;
        status.className = isError ? 'error' : 'success';
        setTimeout(() => {
            status.textContent = '';
            status.className = '';
        }, 3000);
    }

    // Carica i modelli da OpenRouter
    async function loadModels(apiKey) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            modelSelector.innerHTML = ''; // Pulisce le opzioni esistenti
            data.data.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                modelSelector.appendChild(option);
            });

            // Pre-seleziona il modello salvato
            const { selectedModel } = await chrome.storage.sync.get('selectedModel');
            if (selectedModel) {
                modelSelector.value = selectedModel;
            }

        } catch (error) {
            console.error('Errore nel caricamento dei modelli:', error);
            showStatus('Errore nel caricamento dei modelli. Controlla la tua chiave API.', true);
        }
    }

    // Salva la chiave API
    saveApiKeyButton.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.sync.set({apiKey: apiKey}, function() {
                showStatus('Chiave API salvata con successo!');
                loadModels(apiKey); // Carica i modelli dopo aver salvato la chiave
            });
        } else {
            showStatus('Per favore, inserisci una chiave API valida.', true);
        }
    });

    // Salva il modello selezionato
    saveModelButton.addEventListener('click', function() {
        const selectedModel = modelSelector.value;
        if (selectedModel) {
            chrome.storage.sync.set({selectedModel: selectedModel}, function() {
                showStatus('Modello salvato con successo!');
            });
        } else {
            showStatus('Per favore, seleziona un modello.', true);
        }
    });

    // Carica la chiave API e i modelli all'avvio
    chrome.storage.sync.get(['apiKey'], function(result) {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
            loadModels(result.apiKey);
        }
    });
});