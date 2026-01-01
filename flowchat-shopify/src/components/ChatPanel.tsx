/**
 * Chat Panel Component
 * Uses Assistant UI Thread primitives for the chat interface
 */

import { useRef, useEffect } from 'react';
import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  BranchPickerPrimitive,
  ActionBarPrimitive,
} from '@assistant-ui/react';
import { Send, X, Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { WelcomeScreen } from './WelcomeScreen';
import type { ChatPanelProps } from '@/types';

export function ChatPanel({
  config,
  onClose,
  position,
  proactiveMessage: _proactiveMessage,
  onMessageSent: _onMessageSent,
  onMessageReceived: _onMessageReceived,
  enableVoice: _enableVoice,
  enableFileUpload: _enableFileUpload,
}: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="fc-chat-panel"
      data-position={position}
      role="dialog"
      aria-label="Chat"
      aria-modal="true"
    >
      <ChatHeader title={config.chatTitle} onClose={onClose} />

      <ThreadPrimitive.Root className="fc-thread-root">
        {/* Empty state with welcome screen */}
        <ThreadPrimitive.Empty>
          <WelcomeScreen
            message={config.welcomeMessage}
            prompts={config.suggestedPrompts}
          />
        </ThreadPrimitive.Empty>

        {/* Messages viewport with auto-scroll */}
        <ThreadPrimitive.Viewport className="fc-thread-viewport">
          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserMessage,
              AssistantMessage: AssistantMessage,
            }}
          />
        </ThreadPrimitive.Viewport>

        {/* Composer input */}
        <Composer placeholder={config.placeholderText} />
      </ThreadPrimitive.Root>
    </div>
  );
}

/**
 * User Message Component
 */
function UserMessage() {
  return (
    <MessagePrimitive.Root className="fc-message fc-message-user">
      <div className="fc-message-content">
        <div className="fc-message-bubble">
          <MessagePrimitive.Content />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

/**
 * Assistant Message Component
 */
function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="fc-message fc-message-assistant">
      <div className="fc-message-avatar">
        <Sparkles size={16} />
      </div>

      <div className="fc-message-content">
        <div className="fc-message-bubble">
          <MessagePrimitive.Content
            components={{
              Text: ({ text }) => <MarkdownText text={text} />,
            }}
          />
        </div>

        {/* Action bar for assistant messages */}
        <AssistantActionBar />

        {/* Branch picker for regenerated messages */}
        <BranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
}

/**
 * Markdown Text Renderer
 */
function MarkdownText({ text }: { text: string }) {
  // Simple markdown rendering (bold, italic, code, links)
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/g, '<br />');

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Assistant Message Action Bar
 */
function AssistantActionBar() {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="fc-action-bar"
    >
      <ActionBarPrimitive.Copy asChild>
        <button className="fc-action-btn" title="Copy message">
          <MessagePrimitive.If copied>
            <Check size={14} />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <Copy size={14} />
          </MessagePrimitive.If>
        </button>
      </ActionBarPrimitive.Copy>

      <ActionBarPrimitive.Reload asChild>
        <button className="fc-action-btn" title="Regenerate">
          <RefreshCw size={14} />
        </button>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
}

/**
 * Branch Picker for navigating between regenerated messages
 */
function BranchPicker() {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className="fc-branch-picker"
    >
      <BranchPickerPrimitive.Previous asChild>
        <button className="fc-branch-btn" title="Previous version">
          ←
        </button>
      </BranchPickerPrimitive.Previous>

      <span className="fc-branch-info">
        <BranchPickerPrimitive.Number />
        <span>/</span>
        <BranchPickerPrimitive.Count />
      </span>

      <BranchPickerPrimitive.Next asChild>
        <button className="fc-branch-btn" title="Next version">
          →
        </button>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
}

/**
 * Composer Component
 */
function Composer({ placeholder }: { placeholder: string }) {
  return (
    <ComposerPrimitive.Root className="fc-composer">
      <ComposerPrimitive.Input
        autoFocus
        placeholder={placeholder}
        className="fc-composer-input"
        rows={1}
      />

      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <button className="fc-composer-btn fc-send-btn" title="Send message">
            <Send size={18} />
          </button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <button className="fc-composer-btn fc-cancel-btn" title="Stop generating">
            <X size={18} />
          </button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </ComposerPrimitive.Root>
  );
}
