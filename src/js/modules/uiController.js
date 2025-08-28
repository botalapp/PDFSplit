/**
 * UI Controller Module
 * Manages user interface updates and interactions
 */

export class UIController {
    constructor() {
        this.elements = {
            uploadSection: document.getElementById('uploadSection'),
            previewSection: document.getElementById('previewSection'),
            resultsSection: document.getElementById('resultsSection'),
            progressContainer: document.getElementById('progressContainer'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            errorMessage: document.getElementById('errorMessage'),
            loadingOverlay: document.getElementById('loadingOverlay')
        };
    }

    /**
     * Show progress bar with initial progress
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    showProgress(progress = 0, message = '处理中...') {
        this.elements.progressContainer.style.display = 'block';
        this.updateProgress(progress, message);
        this.hideError();
    }

    /**
     * Update progress bar
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    updateProgress(progress, message) {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
        if (this.elements.progressText) {
            this.elements.progressText.textContent = message;
        }
    }

    /**
     * Hide progress bar
     */
    hideProgress() {
        if (this.elements.progressContainer) {
            this.elements.progressContainer.style.display = 'none';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.textContent = message;
            this.elements.errorMessage.style.display = 'block';
            
            // Auto-hide error after 5 seconds
            setTimeout(() => {
                this.hideError();
            }, 5000);
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = 'none';
        }
    }

    /**
     * Show loading overlay
     * @param {string} message - Loading message
     */
    showLoadingOverlay(message = '处理中...') {
        if (this.elements.loadingOverlay) {
            const textElement = this.elements.loadingOverlay.querySelector('p');
            if (textElement) {
                textElement.textContent = message;
            }
            this.elements.loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show upload section
     */
    showUploadSection() {
        if (this.elements.uploadSection) {
            this.elements.uploadSection.style.display = 'block';
        }
    }

    /**
     * Hide upload section
     */
    hideUploadSection() {
        if (this.elements.uploadSection) {
            this.elements.uploadSection.style.display = 'none';
        }
    }

    /**
     * Show preview section
     */
    showPreviewSection() {
        if (this.elements.previewSection) {
            this.elements.previewSection.style.display = 'block';
        }
        this.hideUploadSection();
        this.scrollToSection(this.elements.previewSection);
    }

    /**
     * Hide preview section
     */
    hidePreviewSection() {
        if (this.elements.previewSection) {
            this.elements.previewSection.style.display = 'none';
        }
    }

    /**
     * Show results section
     */
    showResultsSection() {
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'block';
        }
        this.hidePreviewSection();
        this.scrollToSection(this.elements.resultsSection);
    }

    /**
     * Hide results section
     */
    hideResultsSection() {
        if (this.elements.resultsSection) {
            this.elements.resultsSection.style.display = 'none';
        }
    }

    /**
     * Smooth scroll to a section
     * @param {HTMLElement} element - Element to scroll to
     */
    scrollToSection(element) {
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    /**
     * Update file information display
     * @param {string} filename - File name
     * @param {number} pageCount - Number of pages
     * @param {number} fileSize - File size in bytes
     */
    updateFileInfo(filename, pageCount, fileSize) {
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo) {
            const fileSizeText = this.formatFileSize(fileSize);
            fileInfo.innerHTML = `
                <strong>文件名:</strong> ${filename}<br>
                <strong>页数:</strong> ${pageCount} 页<br>
                <strong>大小:</strong> ${fileSizeText}
            `;
        }
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Create temporary success message element
        const successEl = document.createElement('div');
        successEl.className = 'success-message';
        successEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideInRight 0.3s ease-out;
        `;
        successEl.textContent = message;
        
        document.body.appendChild(successEl);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            successEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (document.body.contains(successEl)) {
                    document.body.removeChild(successEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Add loading state to button
     * @param {HTMLElement} button - Button element
     * @param {string} loadingText - Loading text
     */
    setButtonLoading(button, loadingText = '处理中...') {
        if (button) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
            button.style.opacity = '0.7';
        }
    }

    /**
     * Remove loading state from button
     * @param {HTMLElement} button - Button element
     */
    removeButtonLoading(button) {
        if (button) {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
            button.style.opacity = '1';
            delete button.dataset.originalText;
        }
    }

    /**
     * Animate element entrance
     * @param {HTMLElement} element - Element to animate
     * @param {string} animationClass - Animation CSS class
     */
    animateIn(element, animationClass = 'slideUp') {
        if (element) {
            element.style.animation = `${animationClass} 0.5s ease-out`;
        }
    }

    /**
     * Update split options visibility based on selected mode
     * @param {string} mode - Selected split mode
     */
    updateSplitModeVisibility(mode) {
        const optionDetails = {
            'pages': 'splitByPagesDetails',
            'range': 'splitByRangeDetails',
            'extract': 'extractPagesDetails'
        };

        // Hide all details
        Object.values(optionDetails).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });

        // Show selected mode details
        const selectedId = optionDetails[mode];
        if (selectedId) {
            const selectedElement = document.getElementById(selectedId);
            if (selectedElement) {
                selectedElement.style.display = 'block';
            }
        }
    }

    /**
     * Validate form inputs
     * @param {string} mode - Split mode
     * @returns {Object} Validation result
     */
    validateForm(mode) {
        switch (mode) {
            case 'pages':
                const pagesPerFile = document.getElementById('pagesPerFile');
                if (!pagesPerFile || !pagesPerFile.value || parseInt(pagesPerFile.value) < 1) {
                    return {
                        isValid: false,
                        error: '请输入有效的每个文件页数'
                    };
                }
                break;

            case 'range':
                const pageRanges = document.getElementById('pageRanges');
                if (!pageRanges || !pageRanges.value.trim()) {
                    return {
                        isValid: false,
                        error: '请输入页面范围'
                    };
                }
                break;

            case 'extract':
                const specificPages = document.getElementById('specificPages');
                if (!specificPages || !specificPages.value.trim()) {
                    return {
                        isValid: false,
                        error: '请选择要提取的页面'
                    };
                }
                break;
        }

        return {
            isValid: true,
            error: null
        };
    }

    /**
     * Reset form to initial state
     */
    resetForm() {
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // Reset split mode to pages
        const pagesRadio = document.querySelector('input[name="splitMode"][value="pages"]');
        if (pagesRadio) {
            pagesRadio.checked = true;
        }

        // Reset input values
        const inputs = ['pagesPerFile', 'pageRanges', 'specificPages'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = id === 'pagesPerFile' ? '1' : '';
            }
        });

        // Clear thumbnails
        const thumbnailsGrid = document.getElementById('thumbnailsGrid');
        if (thumbnailsGrid) {
            thumbnailsGrid.innerHTML = '';
        }

        // Update split mode visibility
        this.updateSplitModeVisibility('pages');
    }
}