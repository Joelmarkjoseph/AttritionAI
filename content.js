// Content script to inject the overlay
(function() {
  let overlayContainer = null;
  let isVisible = false;

  function createOverlay() {
    if (overlayContainer) return;

    // Create overlay container
    overlayContainer = document.createElement('div');
    overlayContainer.id = 'attritionai-overlay';
    overlayContainer.innerHTML = `
      <div class="attritionai-chat-widget">
        <div class="attritionai-chat-container">
          <!-- Header -->
          <div class="attritionai-chat-header">
            <div class="attritionai-header-content">
              <div class="attritionai-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
              <div class="attritionai-header-info">
                <h1>AttritionAI</h1>
                <span class="attritionai-status">Online</span>
              </div>
            </div>
            <button class="attritionai-close-btn" id="attritionai-close">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <!-- Messages Area -->
          <div class="attritionai-messages-container" id="attritionai-messages">
            <div class="attritionai-welcome-message">
              <div class="attritionai-bot-message">
                <div class="attritionai-message-bubble attritionai-bot">
                  <p>Welcome to AttritionAI!</p>
                  <p>I'm here to help you analyze attrition data. Just enter a User ID and I'll fetch the insights for you.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="attritionai-input-container">
            <div class="attritionai-input-wrapper">
              <input 
                type="text" 
                id="attritionai-userid" 
                placeholder="Enter User ID and press Enter..." 
                class="attritionai-user-id-input"
              />
              <button id="attritionai-send" class="attritionai-send-button">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Configuration Modal -->
        <div id="attritionai-config-modal" class="attritionai-modal">
          <div class="attritionai-modal-content">
            <h2>Configuration Required</h2>
            <p>Please provide your API credentials to get started:</p>
            
            <div class="attritionai-form-group">
              <label for="attritionai-endpoint">Endpoint URL</label>
              <input type="text" id="attritionai-endpoint" placeholder="https://api.example.com/endpoint" />
            </div>
            
            <div class="attritionai-form-group">
              <label for="attritionai-clientid">Client ID</label>
              <input type="text" id="attritionai-clientid" placeholder="Your client ID" />
            </div>
            
            <div class="attritionai-form-group">
              <label for="attritionai-clientsecret">Client Secret</label>
              <input type="password" id="attritionai-clientsecret" placeholder="Your client secret" />
            </div>
            
            <div class="attritionai-modal-actions">
              <button id="attritionai-save-config" class="attritionai-save-button">Save Configuration</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayContainer);
    initializeChat();
  }

  function initializeChat() {
    const chatApp = new AttritionAIChat();
    
    // Close button
    document.getElementById('attritionai-close').addEventListener('click', () => {
      hideOverlay();
    });
  }

  function showOverlay() {
    if (!overlayContainer) {
      createOverlay();
    }
    overlayContainer.style.display = 'flex';
    isVisible = true;
  }

  function hideOverlay() {
    if (overlayContainer) {
      overlayContainer.style.display = 'none';
      isVisible = false;
    }
  }

  function toggleOverlay() {
    if (isVisible) {
      hideOverlay();
    } else {
      showOverlay();
    }
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleOverlay') {
      toggleOverlay();
    }
  });

  // AttritionAI Chat Logic
  class AttritionAIChat {
    constructor() {
      this.messagesContainer = document.getElementById('attritionai-messages');
      this.userIdInput = document.getElementById('attritionai-userid');
      this.sendButton = document.getElementById('attritionai-send');
      this.configModal = document.getElementById('attritionai-config-modal');
      
      this.config = null;
      this.init();
    }

    async init() {
      await this.loadConfig();
      
      if (!this.config) {
        this.showConfigModal();
      }
      
      this.sendButton.addEventListener('click', () => this.sendMessage());
      this.userIdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
      
      document.getElementById('attritionai-save-config').addEventListener('click', () => this.saveConfig());
    }

    async loadConfig() {
      try {
        const result = await chrome.storage.local.get(['attritionAIConfig']);
        this.config = result.attritionAIConfig || null;
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }

    showConfigModal() {
      this.configModal.classList.add('attritionai-show');
      
      if (this.config) {
        document.getElementById('attritionai-endpoint').value = this.config.endpointUrl || '';
        document.getElementById('attritionai-clientid').value = this.config.clientId || '';
        document.getElementById('attritionai-clientsecret').value = this.config.clientSecret || '';
      }
    }

    async saveConfig() {
      const endpointUrl = document.getElementById('attritionai-endpoint').value.trim();
      const clientId = document.getElementById('attritionai-clientid').value.trim();
      const clientSecret = document.getElementById('attritionai-clientsecret').value.trim();

      if (!endpointUrl || !clientId || !clientSecret) {
        this.addBotMessage('Please fill in all configuration fields.', true);
        return;
      }

      this.config = { endpointUrl, clientId, clientSecret };
      
      try {
        await chrome.storage.local.set({ attritionAIConfig: this.config });
        this.configModal.classList.remove('attritionai-show');
        this.addBotMessage('Configuration saved successfully! You can now start chatting.');
      } catch (error) {
        this.addBotMessage('Error saving configuration. Please try again.', true);
      }
    }

    async sendMessage() {
      const userId = this.userIdInput.value.trim();

      if (!userId) {
        this.addBotMessage('Please enter a User ID.', true);
        return;
      }

      if (!this.config) {
        this.showConfigModal();
        return;
      }

      this.addUserMessage(`User ID: ${userId}`);
      this.userIdInput.value = '';
      this.showTypingIndicator();
      await this.makeAPIRequest(userId, '');
    }

    addUserMessage(text) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'attritionai-user-message';
      messageDiv.innerHTML = `
        <div class="attritionai-message-bubble attritionai-user">
          <p>${this.escapeHtml(text)}</p>
          <div class="attritionai-message-time">${this.getCurrentTime()}</div>
        </div>
      `;
      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
    }

    addBotMessage(text, isError = false) {
      this.removeTypingIndicator();
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'attritionai-bot-message';
      messageDiv.innerHTML = `
        <div class="attritionai-message-bubble attritionai-bot ${isError ? 'attritionai-error-message' : ''}">
          <p>${this.escapeHtml(text)}</p>
          <div class="attritionai-message-time">${this.getCurrentTime()}</div>
        </div>
      `;
      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
    }

    showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'attritionai-bot-message attritionai-typing-indicator-container';
      typingDiv.id = 'attritionai-typing';
      typingDiv.innerHTML = `
        <div class="attritionai-message-bubble attritionai-bot">
          <div class="attritionai-typing-indicator">
            <div class="attritionai-typing-dot"></div>
            <div class="attritionai-typing-dot"></div>
            <div class="attritionai-typing-dot"></div>
          </div>
        </div>
      `;
      this.messagesContainer.appendChild(typingDiv);
      this.scrollToBottom();
    }

    removeTypingIndicator() {
      const indicator = document.getElementById('attritionai-typing');
      if (indicator) indicator.remove();
    }

    async makeAPIRequest(userId, message) {
      try {
        // Send request to background script to avoid CORS issues
        const response = await chrome.runtime.sendMessage({
          action: 'makeAPIRequest',
          config: this.config,
          userId: userId,
          message: message
        });

        if (response.success) {
          const formattedResponse = this.formatResponse(response.data);
          this.addBotMessage(formattedResponse);
        } else {
          throw new Error(response.error);
        }
        
      } catch (error) {
        console.error('API Error:', error);
        this.addBotMessage(
          `Error: ${error.message}\n\nPlease check your configuration and try again.`,
          true
        );
      }
    }

    formatResponse(data) {
      if (typeof data === 'string') return data;
      
      if (typeof data === 'object' && data !== null) {
        return this.formatJSONToReadable(data);
      }
      
      return String(data);
    }

    formatJSONToReadable(obj, indent = 0) {
      let result = '';
      const spacing = '  '.repeat(indent);
      
      // Handle nested User object structure
      if (obj.User && obj.User.User) {
        obj = obj.User.User;
      } else if (obj.User) {
        obj = obj.User;
      }
      
      for (const [key, value] of Object.entries(obj)) {
        // Convert camelCase to readable format
        const readableKey = this.camelCaseToReadable(key);
        
        if (value === null || value === undefined || value === '') {
          continue; // Skip empty values
        }
        
        if (typeof value === 'object' && value !== null) {
          result += `\n${spacing}${readableKey}:\n`;
          result += this.formatJSONToReadable(value, indent + 1);
        } else {
          // Format specific fields
          let formattedValue = value;
          
          // Format dates and calculate age for DOB
          if (key.toLowerCase().includes('date') && typeof value === 'string') {
            try {
              const date = new Date(value);
              formattedValue = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
              
              // Calculate age if it's date of birth
              if (key.toLowerCase().includes('birth')) {
                const age = this.calculateAge(date);
                formattedValue += ` (Age: ${age})`;
              }
            } catch (e) {
              formattedValue = value;
            }
          }
          
          // Format risk/impact fields
          if (key.includes('riskOfLoss') || key.includes('impactOfLoss')) {
            formattedValue = formattedValue.replace('rol_', '').replace('iol_', '');
          }
          
          result += `${spacing}• ${readableKey}: ${formattedValue}\n`;
        }
      }
      
      return result;
    }

    camelCaseToReadable(str) {
      // Convert camelCase to readable format
      return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
    }

    calculateAge(birthDate) {
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML.replace(/\n/g, '<br>');
    }

    getCurrentTime() {
      const now = new Date();
      return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }

    scrollToBottom() {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
})();
