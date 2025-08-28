/**
 * Download Manager Module
 * Handles file downloads and blob URL management
 */

export class DownloadManager {
    constructor() {
        this.activeUrls = new Set();
        this.downloadQueue = [];
        this.isProcessingQueue = false;
    }

    /**
     * Create download URL from blob data
     * @param {Uint8Array} data - File data
     * @param {string} mimeType - MIME type
     * @returns {string} Blob URL
     */
    createDownloadUrl(data, mimeType = 'application/pdf') {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        this.activeUrls.add(url);
        return url;
    }

    /**
     * Download file immediately
     * @param {string} url - Download URL
     * @param {string} filename - File name
     * @param {boolean} revokeUrl - Whether to revoke URL after download
     */
    downloadFile(url, filename, revokeUrl = false) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (revokeUrl) {
            setTimeout(() => {
                this.revokeUrl(url);
            }, 1000); // Small delay to ensure download starts
        }
    }

    /**
     * Add download to queue for batch processing
     * @param {string} url - Download URL
     * @param {string} filename - File name
     * @param {number} delay - Delay between downloads (ms)
     */
    addToQueue(url, filename, delay = 100) {
        this.downloadQueue.push({ url, filename, delay });
    }

    /**
     * Process download queue
     * @param {Function} progressCallback - Progress callback function
     */
    async processQueue(progressCallback = null) {
        if (this.isProcessingQueue || this.downloadQueue.length === 0) {
            return;
        }

        this.isProcessingQueue = true;
        const totalItems = this.downloadQueue.length;

        try {
            for (let i = 0; i < this.downloadQueue.length; i++) {
                const item = this.downloadQueue[i];
                
                // Call progress callback if provided
                if (progressCallback) {
                    progressCallback(i + 1, totalItems, item.filename);
                }

                // Download file
                this.downloadFile(item.url, item.filename);

                // Wait before next download
                if (i < this.downloadQueue.length - 1) {
                    await this.delay(item.delay);
                }
            }

            // Clear queue
            this.downloadQueue = [];
            
        } catch (error) {
            console.error('Error processing download queue:', error);
            throw error;
        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Download all files from results array
     * @param {Array} results - Array of file results
     * @param {Function} progressCallback - Progress callback
     */
    async downloadAll(results, progressCallback = null) {
        if (!results || results.length === 0) {
            throw new Error('没有文件可以下载');
        }

        // Clear existing queue
        this.downloadQueue = [];

        // Add all files to queue
        results.forEach(result => {
            this.addToQueue(result.url, result.filename);
        });

        // Process queue
        await this.processQueue(progressCallback);
    }

    /**
     * Create ZIP file from multiple PDFs
     * @param {Array} results - Array of file results
     * @param {string} zipFilename - ZIP file name
     * @returns {Promise<string>} ZIP file URL
     */
    async createZipDownload(results, zipFilename = 'pdfsplit_files.zip') {
        try {
            // This would require a ZIP library like JSZip
            // For now, we'll use the batch download method
            console.warn('ZIP creation not implemented, using batch download');
            await this.downloadAll(results);
            return null;
        } catch (error) {
            console.error('Error creating ZIP:', error);
            throw error;
        }
    }

    /**
     * Revoke blob URL
     * @param {string} url - URL to revoke
     */
    revokeUrl(url) {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
            this.activeUrls.delete(url);
        }
    }

    /**
     * Clean up all active URLs
     */
    cleanupAll() {
        this.activeUrls.forEach(url => {
            URL.revokeObjectURL(url);
        });
        this.activeUrls.clear();
        this.downloadQueue = [];
    }

    /**
     * Get download statistics
     * @returns {Object} Download statistics
     */
    getStats() {
        return {
            activeUrls: this.activeUrls.size,
            queueLength: this.downloadQueue.length,
            isProcessing: this.isProcessingQueue
        };
    }

    /**
     * Utility function to create delay
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if browser supports downloads
     * @returns {boolean} Whether downloads are supported
     */
    isDownloadSupported() {
        const link = document.createElement('a');
        return 'download' in link;
    }

    /**
     * Estimate download size for all files
     * @param {Array} results - Array of file results
     * @returns {Object} Size information
     */
    estimateDownloadSize(results) {
        if (!results || results.length === 0) {
            return { totalSize: 0, formattedSize: '0 Bytes', fileCount: 0 };
        }

        const totalSize = results.reduce((sum, result) => sum + (result.size || 0), 0);
        
        return {
            totalSize,
            formattedSize: this.formatFileSize(totalSize),
            fileCount: results.length
        };
    }

    /**
     * Format file size for display
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size string
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Validate file for download
     * @param {Object} result - File result object
     * @returns {boolean} Whether file is valid for download
     */
    validateDownload(result) {
        return result && 
               result.url && 
               result.filename && 
               typeof result.size === 'number' &&
               result.url.startsWith('blob:');
    }

    /**
     * Generate download report
     * @param {Array} results - Array of file results
     * @returns {Object} Download report
     */
    generateDownloadReport(results) {
        if (!results || results.length === 0) {
            return {
                totalFiles: 0,
                totalSize: 0,
                formattedSize: '0 Bytes',
                validFiles: 0,
                invalidFiles: 0,
                files: []
            };
        }

        const validFiles = results.filter(this.validateDownload);
        const invalidFiles = results.length - validFiles.length;
        const totalSize = validFiles.reduce((sum, result) => sum + result.size, 0);

        return {
            totalFiles: results.length,
            totalSize,
            formattedSize: this.formatFileSize(totalSize),
            validFiles: validFiles.length,
            invalidFiles,
            files: validFiles.map(result => ({
                filename: result.filename,
                size: result.size,
                formattedSize: this.formatFileSize(result.size),
                pageInfo: result.pageInfo || ''
            }))
        };
    }
}