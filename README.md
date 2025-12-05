# AttritionAI - Chrome Extension

A WhatsApp-themed chatbot extension similar to SAP Joule for attrition analysis.

## Features

- 🎨 WhatsApp-inspired dark theme interface
- 💬 Side panel chat interface
- 🔐 Secure credential storage (Client ID, Client Secret, Endpoint URL)
- 👤 User ID-based queries
- 🔄 Real-time API integration
- 💾 Local storage for configuration persistence

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the folder containing these extension files
5. The AttritionAI icon will appear in your extensions toolbar

## Usage

1. **First Time Setup:**
   - Click the AttritionAI extension icon
   - Enter your API credentials in the configuration modal:
     - Endpoint URL
     - Client ID
     - Client Secret
   - Click "Save Configuration"

2. **Sending Messages:**
   - Enter the User ID in the first input field
   - Type your message/query in the main input field
   - Click the send button or press Enter
   - The bot will fetch and display the response

3. **Reconfiguration:**
   - Configuration is saved in local storage
   - To update credentials, you can modify the stored values through the modal

## API Integration

The extension makes GET requests to your configured endpoint with:
- **Authorization:** Basic Auth (Client ID + Client Secret)
- **Headers:**
  - `X-User-ID`: The user ID from the input field
  - `X-Message`: The message content
- **Response:** JSON data displayed in the chat

## File Structure

```
AttritionAI/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── sidepanel.html        # Main UI
├── sidepanel.js          # Application logic
├── styles.css            # WhatsApp-themed styling
├── README.md             # Documentation
└── icons/                # Extension icons (add your own)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Notes

- All credentials are stored locally in Chrome's storage
- The extension requires appropriate CORS headers from your API endpoint
- Make sure your API endpoint accepts the authentication method used

## Customization

You can customize the appearance by modifying `styles.css` or adjust the API request format in `sidepanel.js`.
