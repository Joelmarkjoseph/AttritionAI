// AttritionAI Side Panel Logic
class AttritionAI {
  constructor() {
    this.messagesContainer = document.getElementById('messagesContainer');
    this.userIdInput = document.getElementById('userIdInput');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.configModal = document.getElementById('configModal');
    
    this.config = null;
    this.init();
  }

  async init() {
    // Load configuration from storage
    await this.loadConfig();
    
    // Show config modal if not configured
    if (!this.config) {
      this.showConfigModal();
    }
    
    // Event listeners
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    
    document.getElementById('saveConfig').addEventListener('click', () => this.saveConfig());
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
    this.configModal.classList.add('show');
    
    // Pre-fill if config exists
    if (this.config) {
      document.getElementById('endpointUrl').value = this.config.endpointUrl || '';
      document.getElementById('clientId').value = this.config.clientId || '';
      document.getElementById('clientSecret').value = this.config.clientSecret || '';
    }
  }

  async saveConfig() {
    const endpointUrl = document.getElementById('endpointUrl').value.trim();
    const clientId = document.getElementById('clientId').value.trim();
    const clientSecret = document.getElementById('clientSecret').value.trim();

    if (!endpointUrl || !clientId || !clientSecret) {
      this.addBotMessage('⚠️ Please fill in all configuration fields.', true);
      return;
    }

    this.config = { endpointUrl, clientId, clientSecret };
    
    try {
      await chrome.storage.local.set({ attritionAIConfig: this.config });
      this.configModal.classList.remove('show');
      this.addBotMessage('✅ Configuration saved successfully! You can now start chatting.');
    } catch (error) {
      this.addBotMessage('❌ Error saving configuration. Please try again.', true);
    }
  }

  async sendMessage() {
    const userId = this.userIdInput.value.trim();
    const message = this.messageInput.value.trim();

    if (!userId || !message) {
      this.addBotMessage('⚠️ Please enter both User ID and message.', true);
      return;
    }

    if (!this.config) {
      this.showConfigModal();
      return;
    }

    // Add user message to chat
    this.addUserMessage(`User ID: ${userId}\n${message}`);
    
    // Clear input
    this.messageInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    // Make API request
    await this.makeAPIRequest(userId, message);
  }

  addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'user-message';
    messageDiv.innerHTML = `
      <div class="message-bubble user">
        <p>${this.escapeHtml(text)}</p>
        <div class="message-time">${this.getCurrentTime()}</div>
      </div>
    `;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  addBotMessage(text, isError = false) {
    // Remove typing indicator if exists
    this.removeTypingIndicator();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'bot-message';
    messageDiv.innerHTML = `
      <div class="message-bubble bot ${isError ? 'error-message' : ''}">
        <p>${this.escapeHtml(text)}</p>
        <div class="message-time">${this.getCurrentTime()}</div>
      </div>
    `;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message typing-indicator-container';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
      <div class="message-bubble bot">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
  }

  async makeAPIRequest(userId, message) {
    try {
      const authHeader = 'Basic ' + btoa(`${this.config.clientId}:${this.config.clientSecret}`);
      
      const response = await fetch(this.config.endpointUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          'X-Message': message
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Format and display response
      const formattedResponse = this.formatResponse(data);
      this.addBotMessage(formattedResponse);
      
    } catch (error) {
      console.error('API Error:', error);
      this.addBotMessage(
        `❌ Error: ${error.message}\n\nPlease check your configuration and try again.`,
        true
      );
    }
  }

  formatResponse(data) {
    if (typeof data === 'string') {
      return data;
    }
    
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }
    
    return String(data);
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

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  new AttritionAI();
});
