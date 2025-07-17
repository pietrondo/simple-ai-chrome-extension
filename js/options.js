document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save');
    const apiKeyInput = document.getElementById('apiKey');
    const status = document.getElementById('status');

    // Carica la chiave API salvata, se presente
    chrome.storage.sync.get('apiKey', (data) => {
        if (data.apiKey) {
            apiKeyInput.value = data.apiKey;
        }
    });

    saveButton.addEventListener('click', () => {
        const apiKey = apiKeyInput.value;
        chrome.storage.sync.set({ apiKey }, () => {
            status.textContent = 'Chiave API salvata.';
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        });
    });
});