/**
 * InfoIcon Component
 *
 * A small info icon that displays a tooltip on hover.
 * Used to provide contextual help for complex form fields.
 */

import React from 'react';
import { Tooltip } from './Tooltip';

interface InfoIconProps {
  tooltip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoIcon: React.FC<InfoIconProps> = ({
  tooltip,
  position = 'top',
}) => (
  <Tooltip content={tooltip} position={position}>
    <span
      className="dashicons dashicons-info n8n-chat-info-icon"
      aria-label="More information"
      tabIndex={0}
    />
  </Tooltip>
);

export default InfoIcon;
