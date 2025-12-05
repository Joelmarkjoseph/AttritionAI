// Background service worker for AttritionAI
chrome.action.onClicked.addListener(async (tab) => {
  // Toggle the overlay on the current tab
  chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
});

// Handle API requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'makeAPIRequest') {
    makeAPIRequest(request.config, request.userId, request.message)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

async function makeAPIRequest(config, userId, message) {
  const authHeader = 'Basic ' + btoa(`${config.clientId}:${config.clientSecret}`);
  
  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?><userId>${userId}</userId>`;
  
  console.log('Making request to:', config.endpointUrl);
  console.log('Request body (XML):', xmlBody);
  
  const response = await fetch(config.endpointUrl, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/xml'
    },
    body: xmlBody
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);

  if (!response.ok) {
    // Try to get error details from response
    let errorDetails = '';
    try {
      const errorText = await response.text();
      errorDetails = errorText ? ` - ${errorText}` : '';
    } catch (e) {
      // Ignore if we can't read the error
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}${errorDetails}`);
  }

  return await response.json();
}
