/**
 * n8n Chat Gutenberg Block
 *
 * Block editor component for embedding n8n Chat instances.
 */

import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
    useBlockProps,
    InspectorControls,
} from '@wordpress/block-editor';
import {
    PanelBody,
    SelectControl,
    TextControl,
    ToggleControl,
    RangeControl,
    ColorPicker,
    Placeholder,
    Spinner,
    __experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { comment as chatIcon } from '@wordpress/icons';

import metadata from './block.json';

/**
 * Block Edit Component
 */
function N8nChatEdit({ attributes, setAttributes }) {
    const {
        instanceId,
        mode,
        width,
        height,
        theme,
        primaryColor,
        welcomeMessage,
        placeholder,
        title,
        bubblePosition,
        autoOpen,
        autoOpenDelay,
        showHeader,
        showTimestamp,
        showAvatar,
        requireLogin,
        customClass,
    } = attributes;

    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch available instances
    useEffect(() => {
        const fetchInstances = async () => {
            try {
                const response = await wp.apiFetch({
                    path: '/n8n-chat/v1/admin/instances',
                });
                setInstances(response || []);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchInstances();
    }, []);

    const blockProps = useBlockProps({
        className: `n8n-chat-block n8n-chat-mode-${mode} ${customClass}`.trim(),
    });

    // Instance options for select
    const instanceOptions = [
        { label: __('Select an instance...', 'n8n-chat'), value: '' },
        ...instances.map((inst) => ({
            label: inst.name,
            value: inst.id,
        })),
    ];

    // Get selected instance
    const selectedInstance = instances.find((i) => i.id === instanceId);

    return (
        <>
            <InspectorControls>
                {/* Instance Selection */}
                <PanelBody title={__('Chat Instance', 'n8n-chat')} initialOpen={true}>
                    <SelectControl
                        label={__('Instance', 'n8n-chat')}
                        value={instanceId}
                        options={instanceOptions}
                        onChange={(value) => setAttributes({ instanceId: value })}
                        help={__('Select which chat instance to display.', 'n8n-chat')}
                    />
                    <SelectControl
                        label={__('Display Mode', 'n8n-chat')}
                        value={mode}
                        options={[
                            { label: __('Inline', 'n8n-chat'), value: 'inline' },
                            { label: __('Bubble', 'n8n-chat'), value: 'bubble' },
                            { label: __('Fullscreen', 'n8n-chat'), value: 'fullscreen' },
                        ]}
                        onChange={(value) => setAttributes({ mode: value })}
                    />
                </PanelBody>

                {/* Dimensions (for inline mode) */}
                {mode === 'inline' && (
                    <PanelBody title={__('Dimensions', 'n8n-chat')} initialOpen={false}>
                        <UnitControl
                            label={__('Width', 'n8n-chat')}
                            value={width}
                            onChange={(value) => setAttributes({ width: value })}
                        />
                        <UnitControl
                            label={__('Height', 'n8n-chat')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                        />
                    </PanelBody>
                )}

                {/* Appearance */}
                <PanelBody title={__('Appearance', 'n8n-chat')} initialOpen={false}>
                    <SelectControl
                        label={__('Theme', 'n8n-chat')}
                        value={theme}
                        options={[
                            { label: __('Light', 'n8n-chat'), value: 'light' },
                            { label: __('Dark', 'n8n-chat'), value: 'dark' },
                            { label: __('Auto (System)', 'n8n-chat'), value: 'auto' },
                        ]}
                        onChange={(value) => setAttributes({ theme: value })}
                    />
                    <div className="n8n-chat-color-control">
                        <label>{__('Primary Color (optional)', 'n8n-chat')}</label>
                        <ColorPicker
                            color={primaryColor}
                            onChange={(value) => setAttributes({ primaryColor: value })}
                            enableAlpha={false}
                        />
                        {primaryColor && (
                            <button
                                className="components-button is-secondary is-small"
                                onClick={() => setAttributes({ primaryColor: '' })}
                            >
                                {__('Reset', 'n8n-chat')}
                            </button>
                        )}
                    </div>
                </PanelBody>

                {/* Content Overrides */}
                <PanelBody title={__('Content', 'n8n-chat')} initialOpen={false}>
                    <TextControl
                        label={__('Title Override', 'n8n-chat')}
                        value={title}
                        onChange={(value) => setAttributes({ title: value })}
                        help={__('Leave empty to use instance default.', 'n8n-chat')}
                    />
                    <TextControl
                        label={__('Welcome Message Override', 'n8n-chat')}
                        value={welcomeMessage}
                        onChange={(value) => setAttributes({ welcomeMessage: value })}
                    />
                    <TextControl
                        label={__('Placeholder Override', 'n8n-chat')}
                        value={placeholder}
                        onChange={(value) => setAttributes({ placeholder: value })}
                    />
                </PanelBody>

                {/* Bubble Settings */}
                {mode === 'bubble' && (
                    <PanelBody title={__('Bubble Settings', 'n8n-chat')} initialOpen={false}>
                        <SelectControl
                            label={__('Position', 'n8n-chat')}
                            value={bubblePosition}
                            options={[
                                { label: __('Bottom Right', 'n8n-chat'), value: 'bottom-right' },
                                { label: __('Bottom Left', 'n8n-chat'), value: 'bottom-left' },
                            ]}
                            onChange={(value) => setAttributes({ bubblePosition: value })}
                        />
                        <ToggleControl
                            label={__('Auto Open', 'n8n-chat')}
                            checked={autoOpen}
                            onChange={(value) => setAttributes({ autoOpen: value })}
                        />
                        {autoOpen && (
                            <RangeControl
                                label={__('Auto Open Delay (ms)', 'n8n-chat')}
                                value={autoOpenDelay}
                                onChange={(value) => setAttributes({ autoOpenDelay: value })}
                                min={0}
                                max={30000}
                                step={500}
                            />
                        )}
                    </PanelBody>
                )}

                {/* Display Options */}
                <PanelBody title={__('Display Options', 'n8n-chat')} initialOpen={false}>
                    <ToggleControl
                        label={__('Show Header', 'n8n-chat')}
                        checked={showHeader}
                        onChange={(value) => setAttributes({ showHeader: value })}
                    />
                    <ToggleControl
                        label={__('Show Timestamps', 'n8n-chat')}
                        checked={showTimestamp}
                        onChange={(value) => setAttributes({ showTimestamp: value })}
                    />
                    <ToggleControl
                        label={__('Show Avatars', 'n8n-chat')}
                        checked={showAvatar}
                        onChange={(value) => setAttributes({ showAvatar: value })}
                    />
                </PanelBody>

                {/* Access Control */}
                <PanelBody title={__('Access Control', 'n8n-chat')} initialOpen={false}>
                    <ToggleControl
                        label={__('Require Login', 'n8n-chat')}
                        checked={requireLogin}
                        onChange={(value) => setAttributes({ requireLogin: value })}
                    />
                </PanelBody>

                {/* Advanced */}
                <PanelBody title={__('Advanced', 'n8n-chat')} initialOpen={false}>
                    <TextControl
                        label={__('Custom CSS Class', 'n8n-chat')}
                        value={customClass}
                        onChange={(value) => setAttributes({ customClass: value })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {loading ? (
                    <Placeholder icon={chatIcon} label={__('n8n Chat', 'n8n-chat')}>
                        <Spinner />
                        <p>{__('Loading instances...', 'n8n-chat')}</p>
                    </Placeholder>
                ) : error ? (
                    <Placeholder icon={chatIcon} label={__('n8n Chat', 'n8n-chat')}>
                        <p className="n8n-chat-block-error">{error}</p>
                    </Placeholder>
                ) : !instanceId ? (
                    <Placeholder
                        icon={chatIcon}
                        label={__('n8n Chat', 'n8n-chat')}
                        instructions={__('Select a chat instance to display.', 'n8n-chat')}
                    >
                        <SelectControl
                            value={instanceId}
                            options={instanceOptions}
                            onChange={(value) => setAttributes({ instanceId: value })}
                        />
                    </Placeholder>
                ) : (
                    <div className="n8n-chat-block-preview">
                        <div className="n8n-chat-block-preview-header">
                            <span className="n8n-chat-block-icon">💬</span>
                            <span className="n8n-chat-block-title">
                                {title || selectedInstance?.name || __('n8n Chat', 'n8n-chat')}
                            </span>
                            <span className="n8n-chat-block-mode">{mode}</span>
                        </div>
                        <div className="n8n-chat-block-preview-body">
                            <p className="n8n-chat-block-welcome">
                                {welcomeMessage || selectedInstance?.welcomeMessage || __('Welcome message preview', 'n8n-chat')}
                            </p>
                            <div className="n8n-chat-block-input-preview">
                                <span>{placeholder || selectedInstance?.placeholderText || __('Type your message...', 'n8n-chat')}</span>
                            </div>
                        </div>
                        {mode === 'inline' && (
                            <div className="n8n-chat-block-dimensions">
                                {width} × {height}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

/**
 * Register the block
 */
registerBlockType(metadata.name, {
    icon: chatIcon,
    edit: N8nChatEdit,
    save: () => null, // Dynamic block, rendered via PHP
});
