/**
 * n8n Chat Admin Entry Point
 *
 * Admin React application for managing n8n Chat instances and settings.
 */

import { createRoot } from 'react-dom/client';
import { AdminApp } from './components/admin/App';
import './styles/admin.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('n8n-chat-admin-root');

  if (!container) {
    console.error('n8n Chat Admin: Container not found');
    return;
  }

  // Get the current page from data attribute
  const page = container.dataset.page || 'dashboard';

  // Create React root and render
  const root = createRoot(container);
  root.render(<AdminApp initialPage={page} />);
});

// Export for potential external use
export { AdminApp } from './components/admin/App';
