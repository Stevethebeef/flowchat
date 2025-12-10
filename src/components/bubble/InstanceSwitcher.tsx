/**
 * InstanceSwitcher Component
 *
 * UI component for switching between multiple chat instances in the bubble.
 * Shows tabs/buttons for each available instance with unread counts.
 */

import React from 'react';
import type { InstanceConfig } from '../../context/InstanceManagerContext';

interface InstanceSwitcherProps {
  instances: InstanceConfig[];
  activeInstanceId: string | null;
  onSwitch: (instanceId: string) => void;
  unreadCounts: Record<string, number>;
  layout?: 'tabs' | 'dropdown' | 'icons';
}

export const InstanceSwitcher: React.FC<InstanceSwitcherProps> = ({
  instances,
  activeInstanceId,
  onSwitch,
  unreadCounts,
  layout = 'tabs',
}) => {
  // Don't render if only one instance
  if (instances.length <= 1) {
    return null;
  }

  if (layout === 'dropdown') {
    return (
      <InstanceSwitcherDropdown
        instances={instances}
        activeInstanceId={activeInstanceId}
        onSwitch={onSwitch}
        unreadCounts={unreadCounts}
      />
    );
  }

  if (layout === 'icons') {
    return (
      <InstanceSwitcherIcons
        instances={instances}
        activeInstanceId={activeInstanceId}
        onSwitch={onSwitch}
        unreadCounts={unreadCounts}
      />
    );
  }

  // Default: tabs layout
  return (
    <div className="flowchat-instance-switcher flowchat-instance-switcher--tabs">
      {instances.map((instance) => {
        const isActive = instance.id === activeInstanceId;
        const unreadCount = unreadCounts[instance.id] || 0;

        return (
          <button
            key={instance.id}
            type="button"
            className={`flowchat-instance-tab ${isActive ? 'flowchat-instance-tab--active' : ''}`}
            onClick={() => onSwitch(instance.id)}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Switch to ${instance.name}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          >
            <InstanceAvatar instance={instance} />
            <span className="flowchat-instance-tab__name">{instance.name}</span>
            {unreadCount > 0 && (
              <span className="flowchat-instance-tab__badge">{unreadCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Dropdown variant of instance switcher
 */
const InstanceSwitcherDropdown: React.FC<InstanceSwitcherProps> = ({
  instances,
  activeInstanceId,
  onSwitch,
  unreadCounts,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const activeInstance = instances.find((i) => i.id === activeInstanceId);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="flowchat-instance-switcher flowchat-instance-switcher--dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="flowchat-instance-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {activeInstance && <InstanceAvatar instance={activeInstance} />}
        <span className="flowchat-instance-dropdown__name">
          {activeInstance?.name || 'Select Chat'}
        </span>
        {totalUnread > 0 && (
          <span className="flowchat-instance-dropdown__badge">{totalUnread}</span>
        )}
        <svg
          className={`flowchat-instance-dropdown__arrow ${isOpen ? 'flowchat-instance-dropdown__arrow--open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="flowchat-instance-dropdown__menu" role="listbox">
          {instances.map((instance) => {
            const isActive = instance.id === activeInstanceId;
            const unreadCount = unreadCounts[instance.id] || 0;

            return (
              <button
                key={instance.id}
                type="button"
                className={`flowchat-instance-dropdown__item ${isActive ? 'flowchat-instance-dropdown__item--active' : ''}`}
                onClick={() => {
                  onSwitch(instance.id);
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={isActive}
              >
                <InstanceAvatar instance={instance} />
                <span className="flowchat-instance-dropdown__item-name">{instance.name}</span>
                {unreadCount > 0 && (
                  <span className="flowchat-instance-dropdown__item-badge">{unreadCount}</span>
                )}
                {isActive && (
                  <svg
                    className="flowchat-instance-dropdown__check"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8L6.5 11.5L13 5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Icons-only variant of instance switcher
 */
const InstanceSwitcherIcons: React.FC<InstanceSwitcherProps> = ({
  instances,
  activeInstanceId,
  onSwitch,
  unreadCounts,
}) => {
  return (
    <div className="flowchat-instance-switcher flowchat-instance-switcher--icons">
      {instances.map((instance) => {
        const isActive = instance.id === activeInstanceId;
        const unreadCount = unreadCounts[instance.id] || 0;

        return (
          <button
            key={instance.id}
            type="button"
            className={`flowchat-instance-icon ${isActive ? 'flowchat-instance-icon--active' : ''}`}
            onClick={() => onSwitch(instance.id)}
            aria-current={isActive ? 'true' : undefined}
            aria-label={`Switch to ${instance.name}${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            title={instance.name}
          >
            <InstanceAvatar instance={instance} size="small" />
            {unreadCount > 0 && (
              <span className="flowchat-instance-icon__badge">{unreadCount}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Instance avatar component
 */
interface InstanceAvatarProps {
  instance: InstanceConfig;
  size?: 'small' | 'medium' | 'large';
}

const InstanceAvatar: React.FC<InstanceAvatarProps> = ({ instance, size = 'medium' }) => {
  const avatarUrl = instance.appearance?.avatar?.url;
  const primaryColor = instance.appearance?.colors?.primary || '#3b82f6';
  const initial = instance.name.charAt(0).toUpperCase();

  const sizeClasses = {
    small: 'flowchat-instance-avatar--small',
    medium: 'flowchat-instance-avatar--medium',
    large: 'flowchat-instance-avatar--large',
  };

  return (
    <div
      className={`flowchat-instance-avatar ${sizeClasses[size]}`}
      style={{ backgroundColor: avatarUrl ? 'transparent' : primaryColor }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="flowchat-instance-avatar__image" />
      ) : (
        <span className="flowchat-instance-avatar__initial">{initial}</span>
      )}
    </div>
  );
};

export default InstanceSwitcher;
