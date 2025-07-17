// Funzione per aggiornare la cronologia della chat
async function updateChatHistory(newMessage) {
    const { chatHistory = [] } = await chrome.storage.local.get('chatHistory');
    chatHistory.push(newMessage);
    await chrome.storage.local.set({ chatHistory });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'chat_message') {
        const userMessage = { sender: 'You', message: request.message };
        updateChatHistory(userMessage);

        // Chiamata all'API di OpenRouter
        callOpenRouter(request.message, request.model)
            .then(aiResponse => {
                const aiMessage = { sender: 'AI', message: aiResponse };
                updateChatHistory(aiMessage);
                sendResponse({ reply: aiResponse });
            })
            .catch(error => {
                console.error('Errore API OpenRouter:', error);
                sendResponse({ reply: `Errore: ${error.message}` });
            });

        return true; // Indica che la risposta sarà asincrona
    }
});

async function callOpenRouter(prompt, model) {
  const { apiKey } = await chrome.storage.sync.get('apiKey');

  if (!apiKey) {
    return Promise.resolve("Per favore, imposta la tua chiave API OpenRouter nella pagina delle opzioni dell'estensione.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "model": model,
      "messages": [
        { "role": "user", "content": prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error.message || 'Errore sconosciuto dalla API');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Menu contestuale per interagire con la pagina
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-to-ai",
    title: "Manda alla AI",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "send-to-ai" && info.selectionText) {
        const prompt = info.selectionText;

        // Aggiungiamo il prompt alla cronologia per visibilità
        await updateChatHistory({ sender: 'You', message: prompt });

        try {
            // Usiamo un modello predefinito, o potremmo renderlo configurabile
            const response = await callOpenRouter(prompt, 'openai/gpt-3.5-turbo'); 
            await updateChatHistory({ sender: 'AI', message: response });

            // Notifica l'utente che la risposta è pronta
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Risposta ricevuta',
                message: 'La risposta della AI è stata aggiunta alla cronologia chat.'
            });

        } catch (error) {
            console.error('Errore durante l\'invio alla AI:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Errore',
                message: 'Non è stato possibile ricevere una risposta dalla AI.'
            });
        }
    }
});