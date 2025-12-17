<?php
/**
 * n8n Chat Autoloader
 *
 * PSR-4 style autoloader for N8nChat namespace.
 * Maps N8nChat\{Namespace}\{ClassName} to includes/{namespace}/class-{class-name}.php
 *
 * @package N8nChat
 */

if (!defined('ABSPATH')) {
    exit;
}

spl_autoload_register(function (string $class): void {
    // Only handle N8nChat namespace
    $prefix = 'N8nChat\\';
    $prefix_length = strlen($prefix);

    if (strncmp($prefix, $class, $prefix_length) !== 0) {
        return;
    }

    // Get the relative class name (without the N8nChat\ prefix)
    $relative_class = substr($class, $prefix_length);

    // Convert namespace separators to directory separators
    $path = str_replace('\\', '/', $relative_class);

    // Split into parts
    $parts = explode('/', $path);

    // Get the class name (last part)
    $class_name = array_pop($parts);

    // Convert class name to kebab-case filename
    // Handle both CamelCase (InstanceManager) and underscore style (Instance_Manager)
    // e.g., InstanceManager -> instance-manager
    // e.g., Instance_Manager -> instance-manager
    // e.g., PublicEndpoints -> public-endpoints
    $filename = strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $class_name));
    $filename = str_replace('_', '-', $filename);

    // Build the file path
    // Classes in root namespace: includes/class-{name}.php
    // Classes in sub-namespace: includes/{namespace}/class-{name}.php
    if (empty($parts)) {
        $file = N8N_CHAT_PLUGIN_DIR . 'includes/class-' . $filename . '.php';
    } else {
        // Convert namespace parts to lowercase
        $namespace_path = strtolower(implode('/', $parts));
        $file = N8N_CHAT_PLUGIN_DIR . 'includes/' . $namespace_path . '/class-' . $filename . '.php';
    }

    // Load the file if it exists
    if (file_exists($file)) {
        require_once $file;
    }
});
