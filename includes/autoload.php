<?php
/**
 * FlowChat Autoloader
 *
 * PSR-4 style autoloader for FlowChat namespace.
 * Maps FlowChat\{Namespace}\{ClassName} to includes/{namespace}/class-{class-name}.php
 *
 * @package FlowChat
 */

if (!defined('ABSPATH')) {
    exit;
}

spl_autoload_register(function (string $class): void {
    // Only handle FlowChat namespace
    $prefix = 'FlowChat\\';
    $prefix_length = strlen($prefix);

    if (strncmp($prefix, $class, $prefix_length) !== 0) {
        return;
    }

    // Get the relative class name (without the FlowChat\ prefix)
    $relative_class = substr($class, $prefix_length);

    // Convert namespace separators to directory separators
    $path = str_replace('\\', '/', $relative_class);

    // Split into parts
    $parts = explode('/', $path);

    // Get the class name (last part)
    $class_name = array_pop($parts);

    // Convert CamelCase class name to kebab-case filename
    // e.g., InstanceManager -> instance-manager
    // e.g., PublicEndpoints -> public-endpoints
    $filename = strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $class_name));

    // Build the file path
    // Classes in root namespace: includes/class-{name}.php
    // Classes in sub-namespace: includes/{namespace}/class-{name}.php
    if (empty($parts)) {
        $file = FLOWCHAT_PLUGIN_DIR . 'includes/class-' . $filename . '.php';
    } else {
        // Convert namespace parts to lowercase
        $namespace_path = strtolower(implode('/', $parts));
        $file = FLOWCHAT_PLUGIN_DIR . 'includes/' . $namespace_path . '/class-' . $filename . '.php';
    }

    // Load the file if it exists
    if (file_exists($file)) {
        require_once $file;
    }
});
