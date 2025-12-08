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
                <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="SFIntegrationBot" />
              </div>
              <div class="attritionai-header-info">
                <h1>SFIntegrationBot</h1>
                <span class="attritionai-status">Online</span>
              </div>
            </div>
            <div class="attritionai-header-actions">
              <button class="attritionai-settings-btn" id="attritionai-settings">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                </svg>
              </button>
              <button class="attritionai-close-btn" id="attritionai-close">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="attritionai-messages-container" id="attritionai-messages">
            <div class="attritionai-welcome-message">
              <div class="attritionai-bot-message">
                <div class="attritionai-bot-avatar">
                  <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Bot" />
                </div>
                <div class="attritionai-message-bubble attritionai-bot">
                  <p>Welcome to SFIntegrationBot!</p>
                  <p>I can help you with:</p>
                  <p><br>1. View employee details:<br>   Example: 103271</p>
                  <p><br>2. Get termination recommendation:<br>   Example: Risk analysis of 103271</p>
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
                placeholder="Enter User ID or 'Risk analysis of [ID]'..." 
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
    
    // Settings button
    document.getElementById('attritionai-settings').addEventListener('click', () => {
      chatApp.showConfigModal();
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
        const result = await chrome.storage.local.get(['sfIntegrationBotConfig']);
        this.config = result.sfIntegrationBotConfig || null;
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
        await chrome.storage.local.set({ sfIntegrationBotConfig: this.config });
        this.configModal.classList.remove('attritionai-show');
        this.addBotMessage('Configuration saved successfully! You can now start chatting.');
      } catch (error) {
        this.addBotMessage('Error saving configuration. Please try again.', true);
      }
    }

    async sendMessage() {
      const input = this.userIdInput.value.trim();

      if (!input) {
        this.addBotMessage('Please enter a User ID or query.', true);
        return;
      }

      if (!this.config) {
        this.showConfigModal();
        return;
      }

      // Check if it's a risk analysis query - look for "risk" keyword and extract 6-digit ID
      const hasRiskKeyword = /risk/i.test(input);
      const sixDigitIdMatch = input.match(/\b(\d{6})\b/);

      if (hasRiskKeyword && sixDigitIdMatch) {
        const userId = sixDigitIdMatch[1];
        // Display the original user input
        this.addUserMessage(input);
        this.userIdInput.value = '';
        this.showTypingIndicator();
        await this.makeRiskAnalysisRequest(userId);
      } else {
        // Regular user ID query
        this.addUserMessage(input);
        this.userIdInput.value = '';
        this.showTypingIndicator();
        await this.makeAPIRequest(input, false);
      }
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
        <div class="attritionai-bot-avatar">
          <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Bot" />
        </div>
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
        <div class="attritionai-bot-avatar">
          <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="Bot" />
        </div>
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

    async makeAPIRequest(userId, isRiskAnalysis = false) {
      try {
        // Send request to background script to avoid CORS issues
        const response = await chrome.runtime.sendMessage({
          action: 'makeAPIRequest',
          config: this.config,
          userId: userId,
          isRiskAnalysis: isRiskAnalysis
        });

        if (response.success) {
          if (isRiskAnalysis) {
            return response.data; // Return raw data for risk analysis
          } else {
            const formattedResponse = this.formatResponse(response.data);
            this.addBotMessage(formattedResponse);
          }
        } else {
          throw new Error(response.error);
        }
        
      } catch (error) {
        console.error('API Error:', error);
        
        // Check if it's a server error
        if (error.message.includes('500') || error.message.toLowerCase().includes('internal server error')) {
          this.addBotMessage(
            'There seems to be an issue with the server. Please try again with a different User ID or contact your administrator.',
            true
          );
        } else {
          this.addBotMessage(
            `Error: ${error.message}\n\nPlease check your configuration and try again.`,
            true
          );
        }
        return null;
      }
    }

    async makeRiskAnalysisRequest(requestedUserId) {
      try {
        const data = await this.makeAPIRequest(requestedUserId, true);
        
        if (!data) {
          return; // Error already handled
        }

        // Extract employee data from nested structure
        let employee = null;
        if (data.User && data.User.User) {
          employee = data.User.User;
        } else if (data.User) {
          employee = data.User;
        } else {
          employee = data;
        }

        // Extract all relevant fields from the response
        const userId = employee.userId || requestedUserId;
        const name = employee.defaultFullName || 'Employee';
        const empId = employee.empId || null;
        const riskOfLoss = (employee.riskOfLoss || '').replace('rol_', '').toLowerCase();
        const impactOfLoss = (employee.impactOfLoss || '').replace('iol_', '').toLowerCase();
        const impactOfLossComments = employee.impactOfLossComments || null;
        const directReports = employee.directReports || 0;
        const age = employee.dateOfBirth ? this.calculateAge(new Date(employee.dateOfBirth)) : null;
        const performance = employee.performance || null;
        const potential = employee.potential || null;
        const reviewFreq = employee.reviewFreq || null;
        const seatingChart = employee.seatingChart || null;
        const jobLevel = employee.jobLevel || null;
        const futureLeader = employee.futureLeader || null;
        const division = employee.division || null;
        const criticalTalentComments = employee.criticalTalentComments || null;
        const benchStrength = employee.benchStrength || null;
        const avgRating = employee.externalCodeOfcust_AvgRatingscalcNav || null;

        // Check if we have minimum required data
        if (!riskOfLoss) {
          this.addBotMessage('Incomplete data - could not find risk of loss', true);
          return;
        }

        // Build the recommendation message in paragraph format
        let recommendation = '';
        const firstName = name.split(' ')[0];
        
        // Determine termination recommendation header
        if (riskOfLoss === 'low') {
          recommendation = `📊 Risk Analysis: ${name}\n\n✅ ${name} can be considered for termination based on the following assessment:\n\n`;
        } else if (riskOfLoss === 'medium') {
          recommendation = `📊 Risk Analysis: ${name}\n\n⚠️ ${name} requires careful evaluation before any termination decision:\n\n`;
        } else if (riskOfLoss === 'high') {
          recommendation = `📊 Risk Analysis: ${name}\n\n🛑 ${name} should NOT be terminated:\n\n`;
        } else {
          recommendation = `📊 Risk Analysis: ${name}\n\n`;
        }

        // Build comprehensive paragraph
        let details = [];
        
        // Risk and impact
        details.push(`The risk of loss is ${riskOfLoss} and impact of loss is ${impactOfLoss}`);
        
        // Reporting structure
        if (directReports === 0 || directReports === '0') {
          details.push(`${firstName} has no direct reports`);
        } else if (directReports) {
          details.push(`${firstName} manages ${directReports} team member${directReports > 1 ? 's' : ''}`);
        }
        
        // Demographics and position
        let positionInfo = [];
        if (age) positionInfo.push(`${age} years old`);
        if (jobLevel) positionInfo.push(`working as ${jobLevel}`);
        if (division) positionInfo.push(`in ${division} division`);
        if (positionInfo.length > 0) {
          details.push(positionInfo.join(', '));
        }
        
        // Performance
        let perfInfo = [];
        if (performance && performance !== '0' && performance !== '0.0') {
          perfInfo.push(`performance rating of ${performance}`);
        }
        if (potential && potential !== '0' && potential !== '0.0') {
          perfInfo.push(`potential rating of ${potential}`);
        }
        if (avgRating && avgRating !== '0' && avgRating !== '0.0') {
          perfInfo.push(`average rating of ${avgRating}`);
        }
        if (perfInfo.length > 0) {
          details.push(`${firstName} has ${perfInfo.join(', ')}`);
        }
        
        // Additional considerations
        if (futureLeader && futureLeader !== 'false' && futureLeader !== '0') {
          details.push(`identified as a future leader`);
        }
        if (benchStrength && benchStrength.trim()) {
          details.push(`bench strength is ${benchStrength}`);
        }
        if (seatingChart) {
          details.push(`located at ${seatingChart}`);
        }
        
        // Join all details into paragraph
        recommendation += details.join('. ') + '.';
        
        // Add special comments if available
        if (impactOfLossComments && impactOfLossComments.trim()) {
          recommendation += `\n\n💬 Additional notes: ${impactOfLossComments}`;
        }
        if (criticalTalentComments && criticalTalentComments.trim()) {
          recommendation += `\n\n⭐ Talent insights: ${criticalTalentComments}`;
        }

        this.addBotMessage(recommendation);
        
      } catch (error) {
        console.error('Risk Analysis Error:', error);
        
        // Check if it's a server error
        if (error.message.includes('500') || error.message.toLowerCase().includes('internal server error')) {
          this.addBotMessage(
            'There seems to be an issue with the server. Please try again with a different User ID or contact your administrator.',
            true
          );
        } else {
          this.addBotMessage(
            `Error performing risk analysis: ${error.message}`,
            true
          );
        }
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
