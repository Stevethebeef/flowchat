<?php
/**
 * Import/Export Manager for FlowChat
 *
 * Handles import and export of chat instances and settings.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

defined('ABSPATH') || exit;

/**
 * Import/Export class
 */
class Import_Export {

    /**
     * Export format version
     */
    const EXPORT_VERSION = '1.0';

    /**
     * Singleton instance
     */
    private static ?Import_Export $instance = null;

    /**
     * Instance Manager
     */
    private ?Instance_Manager $instance_manager = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Import_Export {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->instance_manager = Instance_Manager::get_instance();
    }

    /**
     * Export a single instance
     *
     * @param int  $instance_id Instance ID
     * @param bool $include_sensitive Include webhook URLs
     * @return array|null Export data or null if not found
     */
    public function export_instance(int $instance_id, bool $include_sensitive = false): ?array {
        $instance = $this->instance_manager->get_instance($instance_id);

        if (!$instance) {
            return null;
        }

        $export = [
            'export_version' => self::EXPORT_VERSION,
            'export_type' => 'instance',
            'export_date' => current_time('mysql'),
            'site_url' => home_url(),
            'plugin_version' => FLOWCHAT_VERSION,
            'instance' => $this->prepare_instance_export($instance, $include_sensitive),
        ];

        return $export;
    }

    /**
     * Export multiple instances
     *
     * @param array $instance_ids Instance IDs (empty for all)
     * @param bool  $include_sensitive Include webhook URLs
     * @return array Export data
     */
    public function export_instances(array $instance_ids = [], bool $include_sensitive = false): array {
        if (empty($instance_ids)) {
            $instances = $this->instance_manager->get_all_instances();
        } else {
            $instances = array_filter(
                array_map(
                    fn($id) => $this->instance_manager->get_instance($id),
                    $instance_ids
                )
            );
        }

        $export = [
            'export_version' => self::EXPORT_VERSION,
            'export_type' => 'instances',
            'export_date' => current_time('mysql'),
            'site_url' => home_url(),
            'plugin_version' => FLOWCHAT_VERSION,
            'instances' => array_map(
                fn($instance) => $this->prepare_instance_export($instance, $include_sensitive),
                $instances
            ),
        ];

        return $export;
    }

    /**
     * Export global settings
     *
     * @param bool $include_sensitive Include sensitive data
     * @return array Settings export
     */
    public function export_settings(bool $include_sensitive = false): array {
        $settings = get_option('flowchat_settings', []);

        // Remove sensitive data if needed
        if (!$include_sensitive) {
            unset($settings['license_key']);
            unset($settings['api_keys']);
        }

        return [
            'export_version' => self::EXPORT_VERSION,
            'export_type' => 'settings',
            'export_date' => current_time('mysql'),
            'site_url' => home_url(),
            'plugin_version' => FLOWCHAT_VERSION,
            'settings' => $settings,
        ];
    }

    /**
     * Export everything (instances + settings)
     *
     * @param bool $include_sensitive Include sensitive data
     * @return array Full export
     */
    public function export_all(bool $include_sensitive = false): array {
        $instances = $this->instance_manager->get_all_instances();
        $settings = get_option('flowchat_settings', []);
        $custom_templates = get_option('flowchat_custom_templates', []);

        if (!$include_sensitive) {
            unset($settings['license_key']);
            unset($settings['api_keys']);
        }

        return [
            'export_version' => self::EXPORT_VERSION,
            'export_type' => 'full',
            'export_date' => current_time('mysql'),
            'site_url' => home_url(),
            'plugin_version' => FLOWCHAT_VERSION,
            'instances' => array_map(
                fn($instance) => $this->prepare_instance_export($instance, $include_sensitive),
                $instances
            ),
            'settings' => $settings,
            'custom_templates' => $custom_templates,
        ];
    }

    /**
     * Prepare instance data for export
     *
     * @param array $instance Instance data
     * @param bool  $include_sensitive Include sensitive data
     * @return array Prepared export data
     */
    private function prepare_instance_export(array $instance, bool $include_sensitive): array {
        $export = [
            'name' => $instance['name'] ?? '',
            'config' => $instance['config'] ?? [],
            'is_active' => $instance['is_active'] ?? true,
            'url_patterns' => $instance['url_patterns'] ?? [],
        ];

        // Handle webhook URL
        if ($include_sensitive) {
            $export['webhook_url'] = $instance['webhook_url'] ?? '';
        } else {
            $export['webhook_url'] = ''; // Must be configured on import
        }

        // Remove internal fields
        unset($export['config']['_internal']);

        return $export;
    }

    /**
     * Import data from export
     *
     * @param array $data Import data
     * @param array $options Import options
     * @return array Import result
     */
    public function import(array $data, array $options = []): array {
        $defaults = [
            'overwrite' => false,
            'skip_existing' => true,
            'import_settings' => true,
            'import_templates' => true,
        ];

        $options = array_merge($defaults, $options);

        // Validate export format
        if (empty($data['export_version']) || empty($data['export_type'])) {
            return [
                'success' => false,
                'error' => 'Invalid import format',
            ];
        }

        // Check version compatibility
        if (version_compare($data['export_version'], self::EXPORT_VERSION, '>')) {
            return [
                'success' => false,
                'error' => 'Export version is newer than supported',
            ];
        }

        $result = [
            'success' => true,
            'instances_imported' => 0,
            'instances_skipped' => 0,
            'settings_imported' => false,
            'templates_imported' => 0,
            'errors' => [],
        ];

        // Import based on type
        switch ($data['export_type']) {
            case 'instance':
                $instance_result = $this->import_instance($data['instance'], $options);
                if ($instance_result['success']) {
                    $result['instances_imported'] = 1;
                } else {
                    $result['errors'][] = $instance_result['error'];
                }
                break;

            case 'instances':
                foreach ($data['instances'] as $instance) {
                    $instance_result = $this->import_instance($instance, $options);
                    if ($instance_result['success']) {
                        $result['instances_imported']++;
                    } elseif ($instance_result['skipped']) {
                        $result['instances_skipped']++;
                    } else {
                        $result['errors'][] = $instance_result['error'];
                    }
                }
                break;

            case 'settings':
                if ($options['import_settings']) {
                    $settings_result = $this->import_settings($data['settings'], $options);
                    $result['settings_imported'] = $settings_result['success'];
                    if (!$settings_result['success']) {
                        $result['errors'][] = $settings_result['error'];
                    }
                }
                break;

            case 'full':
                // Import instances
                if (!empty($data['instances'])) {
                    foreach ($data['instances'] as $instance) {
                        $instance_result = $this->import_instance($instance, $options);
                        if ($instance_result['success']) {
                            $result['instances_imported']++;
                        } elseif ($instance_result['skipped'] ?? false) {
                            $result['instances_skipped']++;
                        } else {
                            $result['errors'][] = $instance_result['error'];
                        }
                    }
                }

                // Import settings
                if ($options['import_settings'] && !empty($data['settings'])) {
                    $settings_result = $this->import_settings($data['settings'], $options);
                    $result['settings_imported'] = $settings_result['success'];
                }

                // Import custom templates
                if ($options['import_templates'] && !empty($data['custom_templates'])) {
                    foreach ($data['custom_templates'] as $template) {
                        if ($this->import_template($template, $options)) {
                            $result['templates_imported']++;
                        }
                    }
                }
                break;

            default:
                return [
                    'success' => false,
                    'error' => 'Unknown export type: ' . $data['export_type'],
                ];
        }

        $result['success'] = empty($result['errors']);

        return $result;
    }

    /**
     * Import a single instance
     *
     * @param array $instance_data Instance data
     * @param array $options Import options
     * @return array Result
     */
    private function import_instance(array $instance_data, array $options): array {
        // Check if instance with same name exists
        $existing = $this->find_instance_by_name($instance_data['name'] ?? '');

        if ($existing) {
            if ($options['skip_existing']) {
                return ['success' => false, 'skipped' => true];
            }

            if ($options['overwrite']) {
                // Update existing instance
                $update_result = $this->instance_manager->update_instance(
                    $existing['id'],
                    $instance_data
                );

                return [
                    'success' => $update_result !== false,
                    'error' => $update_result === false ? 'Failed to update instance' : null,
                ];
            }

            // Rename to avoid conflict
            $instance_data['name'] = $this->generate_unique_name($instance_data['name']);
        }

        // Create new instance
        $instance_id = $this->instance_manager->create_instance($instance_data);

        return [
            'success' => $instance_id !== false,
            'instance_id' => $instance_id,
            'error' => $instance_id === false ? 'Failed to create instance' : null,
        ];
    }

    /**
     * Import settings
     *
     * @param array $settings Settings data
     * @param array $options Import options
     * @return array Result
     */
    private function import_settings(array $settings, array $options): array {
        $current_settings = get_option('flowchat_settings', []);

        if ($options['overwrite']) {
            // Full replacement
            $new_settings = $settings;
        } else {
            // Merge with existing
            $new_settings = array_merge($current_settings, $settings);
        }

        $success = update_option('flowchat_settings', $new_settings);

        return [
            'success' => $success,
            'error' => $success ? null : 'Failed to update settings',
        ];
    }

    /**
     * Import a template
     *
     * @param array $template Template data
     * @param array $options Import options
     * @return bool Success
     */
    private function import_template(array $template, array $options): bool {
        $template_manager = Template_Manager::get_instance();

        // Generate new ID
        $template['id'] = wp_generate_uuid4();
        $template['imported'] = true;
        $template['imported_at'] = current_time('mysql');

        return $template_manager->save_custom_template($template);
    }

    /**
     * Find instance by name
     *
     * @param string $name Instance name
     * @return array|null Instance or null
     */
    private function find_instance_by_name(string $name): ?array {
        $instances = $this->instance_manager->get_all_instances();

        foreach ($instances as $instance) {
            if (($instance['name'] ?? '') === $name) {
                return $instance;
            }
        }

        return null;
    }

    /**
     * Generate unique instance name
     *
     * @param string $base_name Base name
     * @return string Unique name
     */
    private function generate_unique_name(string $base_name): string {
        $counter = 1;
        $name = $base_name;

        while ($this->find_instance_by_name($name)) {
            $counter++;
            $name = $base_name . ' (' . $counter . ')';
        }

        return $name;
    }

    /**
     * Generate export filename
     *
     * @param string $type Export type
     * @return string Filename
     */
    public function generate_filename(string $type = 'full'): string {
        $site = sanitize_title(get_bloginfo('name'));
        $date = wp_date('Y-m-d');

        return "flowchat-{$type}-{$site}-{$date}.json";
    }

    /**
     * Validate import file
     *
     * @param string $json JSON content
     * @return array Validation result
     */
    public function validate_import(string $json): array {
        $data = json_decode($json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'valid' => false,
                'error' => 'Invalid JSON: ' . json_last_error_msg(),
            ];
        }

        if (empty($data['export_version'])) {
            return [
                'valid' => false,
                'error' => 'Missing export version',
            ];
        }

        if (empty($data['export_type'])) {
            return [
                'valid' => false,
                'error' => 'Missing export type',
            ];
        }

        $valid_types = ['instance', 'instances', 'settings', 'full'];
        if (!in_array($data['export_type'], $valid_types, true)) {
            return [
                'valid' => false,
                'error' => 'Invalid export type',
            ];
        }

        // Count items
        $summary = [
            'instances' => 0,
            'settings' => false,
            'templates' => 0,
        ];

        if ($data['export_type'] === 'instance') {
            $summary['instances'] = 1;
        } elseif (!empty($data['instances'])) {
            $summary['instances'] = count($data['instances']);
        }

        if (!empty($data['settings'])) {
            $summary['settings'] = true;
        }

        if (!empty($data['custom_templates'])) {
            $summary['templates'] = count($data['custom_templates']);
        }

        return [
            'valid' => true,
            'data' => $data,
            'summary' => $summary,
        ];
    }

    /**
     * Create downloadable export
     *
     * @param array  $data Export data
     * @param string $filename Filename
     */
    public function download_export(array $data, string $filename): void {
        $json = wp_json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($json));
        header('Cache-Control: no-cache, no-store, must-revalidate');

        echo $json;
        exit;
    }
}
