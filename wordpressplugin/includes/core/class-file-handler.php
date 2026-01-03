<?php
/**
 * File Handler
 *
 * Handles file uploads and cleanup for chat attachments.
 * Files are stored in a separate directory from WordPress Media Library.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class File_Handler
 */
class File_Handler {

    /**
     * Upload directory relative to wp-content/uploads
     */
    private const UPLOAD_DIR = 'n8n-chat/temp';

    /**
     * Default file retention in hours
     */
    private const DEFAULT_RETENTION_HOURS = 24;

    /**
     * Maximum file size (10MB)
     */
    private const MAX_FILE_SIZE = 10485760;

    /**
     * Default allowed MIME types
     */
    private const DEFAULT_ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    /**
     * Constructor
     */
    public function __construct() {
        // Register cleanup hook
        add_action('n8n_chat_cleanup_files', [$this, 'cleanup_old_files']);
    }

    /**
     * Handle file upload
     *
     * @param array $file $_FILES array item
     * @param string $instance_id Instance ID
     * @return array|\WP_Error Upload result or error
     */
    public function handle_upload(array $file, string $instance_id) {
        // Get instance configuration
        $instance_manager = Instance_Manager::get_instance();
        $instance = $instance_manager->get($instance_id);

        if (!$instance) {
            return new \WP_Error('invalid_instance', __('Invalid instance ID.', 'n8n-chat'));
        }

        if (empty($instance['features']['fileUpload'])) {
            return new \WP_Error('uploads_disabled', __('File uploads are not enabled for this chat.', 'n8n-chat'));
        }

        // Validate file
        $validation = $this->validate_file($file, $instance);
        if (is_wp_error($validation)) {
            return $validation;
        }

        // Generate safe filename
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $date_folder = gmdate('Y-m-d');

        // Get upload directory
        $upload_dir = wp_upload_dir();
        $target_dir = $upload_dir['basedir'] . '/' . self::UPLOAD_DIR . '/' . $date_folder;

        // Create directory if needed
        if (!file_exists($target_dir)) {
            wp_mkdir_p($target_dir);
            $this->protect_directory($upload_dir['basedir'] . '/' . self::UPLOAD_DIR);
        }

        $target_path = $target_dir . '/' . $filename;

        // Move uploaded file
        // phpcs:ignore Generic.PHP.ForbiddenFunctions.Found -- move_uploaded_file is required for file uploads from $_FILES
        if (!move_uploaded_file($file['tmp_name'], $target_path)) {
            return new \WP_Error('upload_failed', __('Failed to save uploaded file.', 'n8n-chat'));
        }

        // Set proper permissions
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_chmod -- Setting permissions on uploaded file
        chmod($target_path, 0644);

        // Generate URL
        $url = $upload_dir['baseurl'] . '/' . self::UPLOAD_DIR . '/' . $date_folder . '/' . $filename;

        // Get retention hours
        $settings = get_option('n8n_chat_global_settings', []);
        $retention_hours = $settings['file_retention_hours'] ?? self::DEFAULT_RETENTION_HOURS;

        return [
            'success' => true,
            'url' => $url,
            'filename' => $file['name'],
            'mime_type' => $file['type'],
            'size' => $file['size'],
            'expires_at' => gmdate('c', time() + ($retention_hours * 3600)),
        ];
    }

    /**
     * Validate uploaded file
     *
     * @param array $file File data
     * @param array $instance Instance configuration
     * @return true|\WP_Error
     */
    private function validate_file(array $file, array $instance) {
        // Check for upload errors
        if (!empty($file['error'])) {
            return new \WP_Error('upload_error', $this->get_upload_error_message($file['error']));
        }

        // Check if file exists
        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return new \WP_Error('no_file', __('No file was uploaded.', 'n8n-chat'));
        }

        // Check file size
        $max_size = $instance['features']['maxFileSize'] ?? self::MAX_FILE_SIZE;
        if ($file['size'] > $max_size) {
            return new \WP_Error(
                'file_too_large',
                sprintf(
                    /* translators: %s: maximum file size */
                    __('File size exceeds the maximum allowed size of %s.', 'n8n-chat'),
                    size_format($max_size)
                )
            );
        }

        // Check MIME type
        $allowed_types = $instance['features']['fileTypes'] ?? self::DEFAULT_ALLOWED_TYPES;

        // Verify actual MIME type (not just what browser says)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $actual_mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($actual_mime, $allowed_types, true)) {
            return new \WP_Error(
                'invalid_type',
                sprintf(
                    /* translators: %s: file type */
                    __('File type "%s" is not allowed.', 'n8n-chat'),
                    $actual_mime
                )
            );
        }

        // Check extension
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        // Block dangerous extensions including SVG (XSS risk due to embedded JavaScript)
        $dangerous_extensions = [
            'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'phar',
            'exe', 'sh', 'bat', 'cmd',
            'svg', 'svgz', // Block SVG files - can contain embedded JavaScript (XSS risk)
        ];

        if (in_array($ext, $dangerous_extensions, true)) {
            return new \WP_Error('dangerous_file', __('This file type is not allowed for security reasons.', 'n8n-chat'));
        }

        return true;
    }

    /**
     * Get human-readable upload error message
     *
     * @param int $error_code PHP upload error code
     * @return string Error message
     */
    private function get_upload_error_message(int $error_code): string {
        $messages = [
            UPLOAD_ERR_INI_SIZE => __('The file exceeds the maximum upload size.', 'n8n-chat'),
            UPLOAD_ERR_FORM_SIZE => __('The file exceeds the maximum upload size.', 'n8n-chat'),
            UPLOAD_ERR_PARTIAL => __('The file was only partially uploaded.', 'n8n-chat'),
            UPLOAD_ERR_NO_FILE => __('No file was uploaded.', 'n8n-chat'),
            UPLOAD_ERR_NO_TMP_DIR => __('Server configuration error: missing temp folder.', 'n8n-chat'),
            UPLOAD_ERR_CANT_WRITE => __('Server configuration error: failed to write file.', 'n8n-chat'),
            UPLOAD_ERR_EXTENSION => __('File upload stopped by server extension.', 'n8n-chat'),
        ];

        return $messages[$error_code] ?? __('Unknown upload error.', 'n8n-chat');
    }

    /**
     * Protect upload directory with .htaccess
     *
     * @param string $dir Directory path
     */
    private function protect_directory(string $dir): void {
        // Add .htaccess
        $htaccess_file = $dir . '/.htaccess';
        if (!file_exists($htaccess_file)) {
            $htaccess_content = "# n8n Chat upload protection\n";
            $htaccess_content .= "Options -Indexes\n";
            $htaccess_content .= "<FilesMatch \"\\.(php|phtml|php3|php4|php5|php7|phps|phar|exe|sh|bat|cmd)$\">\n";
            $htaccess_content .= "    Order Allow,Deny\n";
            $htaccess_content .= "    Deny from all\n";
            $htaccess_content .= "</FilesMatch>\n";

            file_put_contents($htaccess_file, $htaccess_content);
        }

        // Add index.php
        $index_file = $dir . '/index.php';
        if (!file_exists($index_file)) {
            file_put_contents($index_file, '<?php // Silence is golden');
        }
    }

    /**
     * Cleanup old files
     *
     * @return int Number of deleted files
     */
    public function cleanup_old_files(): int {
        $settings = get_option('n8n_chat_global_settings', []);
        $retention_hours = $settings['file_retention_hours'] ?? self::DEFAULT_RETENTION_HOURS;

        $upload_dir = wp_upload_dir();
        $temp_dir = $upload_dir['basedir'] . '/' . self::UPLOAD_DIR;

        if (!is_dir($temp_dir)) {
            return 0;
        }

        $cutoff = time() - ($retention_hours * 3600);
        $deleted_count = 0;

        // Iterate through date folders
        $date_folders = glob($temp_dir . '/*', GLOB_ONLYDIR);

        foreach ($date_folders as $date_folder) {
            $folder_date = strtotime(basename($date_folder));

            // Delete entire folder if it's old enough
            if ($folder_date && $folder_date < $cutoff) {
                $deleted_count += $this->delete_directory($date_folder);
            }
        }

        return $deleted_count;
    }

    /**
     * Delete a directory and its contents
     *
     * @param string $dir Directory path
     * @return int Number of deleted files
     */
    private function delete_directory(string $dir): int {
        if (!is_dir($dir)) {
            return 0;
        }

        $deleted = 0;
        $files = array_diff(scandir($dir), ['.', '..']);

        foreach ($files as $file) {
            $path = $dir . '/' . $file;

            if (is_dir($path)) {
                $deleted += $this->delete_directory($path);
            } else {
                wp_delete_file($path);
                if (!file_exists($path)) {
                    $deleted++;
                }
            }
        }

        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- Removing empty directory after all files deleted
        rmdir($dir);

        return $deleted;
    }

    /**
     * Get upload directory URL
     *
     * @return string
     */
    public function get_upload_url(): string {
        $upload_dir = wp_upload_dir();
        return $upload_dir['baseurl'] . '/' . self::UPLOAD_DIR;
    }

    /**
     * Get upload directory path
     *
     * @return string
     */
    public function get_upload_path(): string {
        $upload_dir = wp_upload_dir();
        return $upload_dir['basedir'] . '/' . self::UPLOAD_DIR;
    }

    /**
     * Get total size of uploaded files
     *
     * @return int Size in bytes
     */
    public function get_total_upload_size(): int {
        $path = $this->get_upload_path();

        if (!is_dir($path)) {
            return 0;
        }

        $size = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    /**
     * Get file count in upload directory
     *
     * @return int
     */
    public function get_file_count(): int {
        $path = $this->get_upload_path();

        if (!is_dir($path)) {
            return 0;
        }

        $count = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && !in_array($file->getFilename(), ['.htaccess', 'index.php'], true)) {
                $count++;
            }
        }

        return $count;
    }
}
