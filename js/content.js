// Ascolta i messaggi dal background script o dal popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'get_page_content') {
    // In futuro, potremmo estrarre qui il testo principale della pagina
    // o altre informazioni.
    sendResponse({ content: document.body.innerText.substring(0, 5000) });
  }
});

console.log("Content script caricato.");