/**
 * File Handler Module
 * Handles file validation and reading operations
 */

export class FileHandler {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedTypes = ['application/pdf'];
    }

    /**
     * Validate uploaded file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        // Check if file exists
        if (!file) {
            return {
                isValid: false,
                error: '请选择一个文件'
            };
        }

        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                error: '请上传 PDF 文件'
            };
        }

        // Check file extension
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return {
                isValid: false,
                error: '文件扩展名必须是 .pdf'
            };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            const maxSizeMB = this.maxFileSize / (1024 * 1024);
            return {
                isValid: false,
                error: `文件大小不能超过 ${maxSizeMB}MB`
            };
        }

        // Check if file is empty
        if (file.size === 0) {
            return {
                isValid: false,
                error: '文件不能为空'
            };
        }

        return {
            isValid: true,
            error: null
        };
    }

    /**
     * Read file as ArrayBuffer
     * @param {File} file - File to read
     * @returns {Promise<ArrayBuffer>} File content
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            
            reader.onerror = (e) => {
                reject(new Error('读取文件失败'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Create download blob URL
     * @param {Uint8Array} data - File data
     * @param {string} mimeType - MIME type
     * @returns {string} Blob URL
     */
    createDownloadUrl(data, mimeType = 'application/pdf') {
        const blob = new Blob([data], { type: mimeType });
        return URL.createObjectURL(blob);
    }

    /**
     * Generate unique filename
     * @param {string} originalName - Original filename
     * @param {string} suffix - Suffix to add
     * @returns {string} New filename
     */
    generateFilename(originalName, suffix) {
        const nameWithoutExt = originalName.replace(/\.pdf$/i, '');
        return `${nameWithoutExt}_${suffix}.pdf`;
    }

    /**
     * Calculate file size from data
     * @param {Uint8Array} data - File data
     * @returns {number} File size in bytes
     */
    calculateFileSize(data) {
        return data.byteLength;
    }

    /**
     * Clean up blob URLs
     * @param {string[]} urls - Array of blob URLs to revoke
     */
    cleanupUrls(urls) {
        urls.forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
    }
}