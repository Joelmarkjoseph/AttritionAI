// Background service worker for AttritionBot
chrome.action.onClicked.addListener(async (tab) => {
  // Check if the tab URL contains 'successfactors'
  if (tab.url && tab.url.includes('successfactors')) {
    // Toggle the overlay on the current tab
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
    } catch (error) {
      console.log('Content script not ready yet, injecting...');
      // If content script isn't loaded, inject it manually
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['overlay.css']
      });
      // Try again after a short delay
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
      }, 100);
    }
  } else {
    // Show alert if not on SuccessFactors page
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        alert('AttritionBot only works on SuccessFactors pages.\n\nPlease navigate to a page with "successfactors" in the URL.');
      }
    });
  }
});

// Handle API requests from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'makeAPIRequest') {
    makeAPIRequest(request.config, request.userId)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep the message channel open for async response
  }
});

async function makeAPIRequest(config, userId) {
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
