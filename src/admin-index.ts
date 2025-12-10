/**
 * FlowChat Admin Entry Point
 *
 * Admin React application for managing FlowChat instances and settings.
 */

import { createRoot } from 'react-dom/client';
import { AdminApp } from './components/admin/App';
import './styles/admin.css';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('flowchat-admin-root');

  if (!container) {
    console.error('FlowChat Admin: Container not found');
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
