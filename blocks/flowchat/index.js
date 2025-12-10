/**
 * FlowChat Gutenberg Block
 *
 * Block editor component for embedding FlowChat instances.
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
function FlowChatEdit({ attributes, setAttributes }) {
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
                    path: '/flowchat/v1/admin/instances',
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
        className: `flowchat-block flowchat-mode-${mode} ${customClass}`.trim(),
    });

    // Instance options for select
    const instanceOptions = [
        { label: __('Select an instance...', 'flowchat'), value: '' },
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
                <PanelBody title={__('Chat Instance', 'flowchat')} initialOpen={true}>
                    <SelectControl
                        label={__('Instance', 'flowchat')}
                        value={instanceId}
                        options={instanceOptions}
                        onChange={(value) => setAttributes({ instanceId: value })}
                        help={__('Select which chat instance to display.', 'flowchat')}
                    />
                    <SelectControl
                        label={__('Display Mode', 'flowchat')}
                        value={mode}
                        options={[
                            { label: __('Inline', 'flowchat'), value: 'inline' },
                            { label: __('Bubble', 'flowchat'), value: 'bubble' },
                            { label: __('Fullscreen', 'flowchat'), value: 'fullscreen' },
                        ]}
                        onChange={(value) => setAttributes({ mode: value })}
                    />
                </PanelBody>

                {/* Dimensions (for inline mode) */}
                {mode === 'inline' && (
                    <PanelBody title={__('Dimensions', 'flowchat')} initialOpen={false}>
                        <UnitControl
                            label={__('Width', 'flowchat')}
                            value={width}
                            onChange={(value) => setAttributes({ width: value })}
                        />
                        <UnitControl
                            label={__('Height', 'flowchat')}
                            value={height}
                            onChange={(value) => setAttributes({ height: value })}
                        />
                    </PanelBody>
                )}

                {/* Appearance */}
                <PanelBody title={__('Appearance', 'flowchat')} initialOpen={false}>
                    <SelectControl
                        label={__('Theme', 'flowchat')}
                        value={theme}
                        options={[
                            { label: __('Light', 'flowchat'), value: 'light' },
                            { label: __('Dark', 'flowchat'), value: 'dark' },
                            { label: __('Auto (System)', 'flowchat'), value: 'auto' },
                        ]}
                        onChange={(value) => setAttributes({ theme: value })}
                    />
                    <div className="flowchat-color-control">
                        <label>{__('Primary Color (optional)', 'flowchat')}</label>
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
                                {__('Reset', 'flowchat')}
                            </button>
                        )}
                    </div>
                </PanelBody>

                {/* Content Overrides */}
                <PanelBody title={__('Content', 'flowchat')} initialOpen={false}>
                    <TextControl
                        label={__('Title Override', 'flowchat')}
                        value={title}
                        onChange={(value) => setAttributes({ title: value })}
                        help={__('Leave empty to use instance default.', 'flowchat')}
                    />
                    <TextControl
                        label={__('Welcome Message Override', 'flowchat')}
                        value={welcomeMessage}
                        onChange={(value) => setAttributes({ welcomeMessage: value })}
                    />
                    <TextControl
                        label={__('Placeholder Override', 'flowchat')}
                        value={placeholder}
                        onChange={(value) => setAttributes({ placeholder: value })}
                    />
                </PanelBody>

                {/* Bubble Settings */}
                {mode === 'bubble' && (
                    <PanelBody title={__('Bubble Settings', 'flowchat')} initialOpen={false}>
                        <SelectControl
                            label={__('Position', 'flowchat')}
                            value={bubblePosition}
                            options={[
                                { label: __('Bottom Right', 'flowchat'), value: 'bottom-right' },
                                { label: __('Bottom Left', 'flowchat'), value: 'bottom-left' },
                            ]}
                            onChange={(value) => setAttributes({ bubblePosition: value })}
                        />
                        <ToggleControl
                            label={__('Auto Open', 'flowchat')}
                            checked={autoOpen}
                            onChange={(value) => setAttributes({ autoOpen: value })}
                        />
                        {autoOpen && (
                            <RangeControl
                                label={__('Auto Open Delay (ms)', 'flowchat')}
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
                <PanelBody title={__('Display Options', 'flowchat')} initialOpen={false}>
                    <ToggleControl
                        label={__('Show Header', 'flowchat')}
                        checked={showHeader}
                        onChange={(value) => setAttributes({ showHeader: value })}
                    />
                    <ToggleControl
                        label={__('Show Timestamps', 'flowchat')}
                        checked={showTimestamp}
                        onChange={(value) => setAttributes({ showTimestamp: value })}
                    />
                    <ToggleControl
                        label={__('Show Avatars', 'flowchat')}
                        checked={showAvatar}
                        onChange={(value) => setAttributes({ showAvatar: value })}
                    />
                </PanelBody>

                {/* Access Control */}
                <PanelBody title={__('Access Control', 'flowchat')} initialOpen={false}>
                    <ToggleControl
                        label={__('Require Login', 'flowchat')}
                        checked={requireLogin}
                        onChange={(value) => setAttributes({ requireLogin: value })}
                    />
                </PanelBody>

                {/* Advanced */}
                <PanelBody title={__('Advanced', 'flowchat')} initialOpen={false}>
                    <TextControl
                        label={__('Custom CSS Class', 'flowchat')}
                        value={customClass}
                        onChange={(value) => setAttributes({ customClass: value })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                {loading ? (
                    <Placeholder icon={chatIcon} label={__('FlowChat', 'flowchat')}>
                        <Spinner />
                        <p>{__('Loading instances...', 'flowchat')}</p>
                    </Placeholder>
                ) : error ? (
                    <Placeholder icon={chatIcon} label={__('FlowChat', 'flowchat')}>
                        <p className="flowchat-block-error">{error}</p>
                    </Placeholder>
                ) : !instanceId ? (
                    <Placeholder
                        icon={chatIcon}
                        label={__('FlowChat', 'flowchat')}
                        instructions={__('Select a chat instance to display.', 'flowchat')}
                    >
                        <SelectControl
                            value={instanceId}
                            options={instanceOptions}
                            onChange={(value) => setAttributes({ instanceId: value })}
                        />
                    </Placeholder>
                ) : (
                    <div className="flowchat-block-preview">
                        <div className="flowchat-block-preview-header">
                            <span className="flowchat-block-icon">💬</span>
                            <span className="flowchat-block-title">
                                {title || selectedInstance?.name || __('FlowChat', 'flowchat')}
                            </span>
                            <span className="flowchat-block-mode">{mode}</span>
                        </div>
                        <div className="flowchat-block-preview-body">
                            <p className="flowchat-block-welcome">
                                {welcomeMessage || selectedInstance?.welcomeMessage || __('Welcome message preview', 'flowchat')}
                            </p>
                            <div className="flowchat-block-input-preview">
                                <span>{placeholder || selectedInstance?.placeholderText || __('Type your message...', 'flowchat')}</span>
                            </div>
                        </div>
                        {mode === 'inline' && (
                            <div className="flowchat-block-dimensions">
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
    edit: FlowChatEdit,
    save: () => null, // Dynamic block, rendered via PHP
});
