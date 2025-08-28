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
                error: 'Please select a file'
            };
        }

        // Check file extension first (more reliable than MIME type)
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return {
                isValid: false,
                error: 'Please upload a PDF file (.pdf format)'
            };
        }

        // Check file type (some browsers may not set correct MIME type)
        if (file.type && !this.allowedTypes.includes(file.type) && file.type !== '') {
            return {
                isValid: false,
                error: 'Incorrect file type. Please upload a PDF file'
            };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            const maxSizeMB = this.maxFileSize / (1024 * 1024);
            return {
                isValid: false,
                error: `File size cannot exceed ${maxSizeMB}MB`
            };
        }

        // Check if file is empty
        if (file.size === 0) {
            return {
                isValid: false,
                error: 'File cannot be empty'
            };
        }

        // Check minimum file size (PDF files are usually at least 1KB)
        if (file.size < 1024) {
            return {
                isValid: false,
                error: 'File is too small, it may not be a valid PDF file'
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
            
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                
                // Validate PDF file header
                const isValidPDF = this.validatePDFHeader(arrayBuffer);
                if (!isValidPDF) {
                    reject(new Error('Not a valid PDF file format'));
                    return;
                }
                
                resolve(arrayBuffer);
            };
            
            reader.onerror = (e) => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Validate PDF file header
     * @param {ArrayBuffer} buffer - File buffer
     * @returns {boolean} Whether file has valid PDF header
     */
    validatePDFHeader(buffer) {
        // 基础检查
        if (!buffer || buffer.byteLength < 5) {
            return false;
        }
        
        // 检查PDF文件头
        const uint8Array = new Uint8Array(buffer, 0, 5);
        const header = Array.from(uint8Array)
            .map(byte => String.fromCharCode(byte))
            .join('');
        
        // PDF文件必须以%PDF-开头
        if (header !== '%PDF-') {
            return false;
        }
        
        // 尝试检查文件尾（可选，但能提高验证准确性）
        // 检查最后5个字节是否包含EOF标记
        if (buffer.byteLength > 10) {
            const endUint8Array = new Uint8Array(buffer, buffer.byteLength - 6, 6);
            const endContent = Array.from(endUint8Array)
                .map(byte => String.fromCharCode(byte))
                .join('');
            
            // PDF文件通常在末尾包含%%EOF标记
            if (!endContent.includes('%%EOF')) {
                console.warn('PDF文件可能不完整，未找到%%EOF标记');
                // 注意：这里不返回false，因为有些有效的PDF文件可能没有标准的EOF标记
            }
        }
        
        return true;
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