const fs = require('fs');
const path = 'src/runtime/N8nRuntimeAdapter.ts';
let content = fs.readFileSync(path, 'utf8');

// Add getErrorMessage method after constructor
const constructorEnd = `  constructor(config: N8nConfig) {
    this.config = config;
  }`;
const getErrorMessageMethod = `  constructor(config: N8nConfig) {
    this.config = config;
  }

  /**
   * Get custom error message based on error type
   */
  private getErrorMessage(error: Error, statusCode?: number): string {
    const errorMessages = this.config.errorMessages || {};

    // Check for rate limit error
    if (statusCode === 429) {
      return errorMessages.rateLimit || 'Rate limit exceeded. Please wait a moment before trying again.';
    }

    // Check for timeout error
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return errorMessages.timeout || 'Request timed out. Please try again.';
    }

    // Check for connection error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return errorMessages.connection || 'Unable to connect. Please check your connection and try again.';
    }

    // Generic error message
    return errorMessages.generic || error.message || 'An error occurred. Please try again.';
  }`;

content = content.replace(constructorEnd, getErrorMessageMethod);

// Update request body to use dynamic keys
const oldRequestBody = `    const requestBody: Record<string, unknown> = {
      action: 'sendMessage',
      sessionId: this.config.sessionId,
      chatInput: chatInput,
      context: this.config.context,
    };`;

const newRequestBody = `    // Use custom key names or defaults
    const chatInputKey = this.config.chatInputKey || 'chatInput';
    const sessionKey = this.config.sessionKey || 'sessionId';

    // Build request body with dynamic keys
    const requestBody: Record<string, unknown> = {
      action: 'sendMessage',
      [sessionKey]: this.config.sessionId,
      [chatInputKey]: chatInput,
      context: this.config.context,
    };`;

content = content.replace(oldRequestBody, newRequestBody);

// Update error handling in catch block to use custom messages
const oldCatch = `    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled
        return;
      }

      this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }`;

const newCatch = `    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled
        return;
      }

      // Use custom error message if available
      const customMessage = this.getErrorMessage(error instanceof Error ? error : new Error(String(error)));
      const customError = new Error(customMessage);
      this.config.onError?.(customError);
      throw customError;
    }`;

content = content.replace(oldCatch, newCatch);

// Update HTTP error handling to use custom messages
const oldHttpError = /      if \(!response\.ok\) \{\s*const errorText = await response\.text\(\);\s*throw new Error\(`HTTP \$\{response\.status\}: \$\{errorText\}`\);\s*\}/;

const newHttpError = `      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(\`HTTP \${response.status}: \${errorText}\`);
        const customMessage = this.getErrorMessage(error, response.status);
        const customError = new Error(customMessage);
        this.config.onError?.(customError);
        throw customError;
      }`;

content = content.replace(oldHttpError, newHttpError);

fs.writeFileSync(path, content);
console.log('File updated successfully');
