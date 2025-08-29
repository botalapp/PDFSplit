/**
 * PDFSplit - Main JavaScript Module
 * Client-side PDF splitting tool with drag-and-drop upload
 */

// Import utility modules
import { FileHandler } from './modules/fileHandler.js';
import { PDFProcessor } from './modules/pdfProcessor.js';
import { PDFProcessorSimple } from './modules/pdfProcessorSimple.js';
import { UIController } from './modules/uiController.js';
import { DownloadManager } from './modules/downloadManager.js';

class PDFSplitApp {
    constructor() {
        this.fileHandler = new FileHandler();
        
        // 根据PDF.js加载状态选择合适的处理器
        // 优先使用完整版本，但如果PDF.js不可用则使用简化版本
        if (window.pdfJsAvailable && typeof PDFProcessor !== 'undefined') {
            try {
                this.pdfProcessor = new PDFProcessor();
                this.usingSimpleProcessor = false;
                console.log('Using full PDF processor with PDF.js support');
            } catch (error) {
                console.warn('Full PDF processor initialization failed, falling back to simple version:', error);
                this.pdfProcessor = new PDFProcessorSimple();
                this.usingSimpleProcessor = true;
            }
        } else {
            console.warn('PDF.js not available or PDFProcessor not defined, using simplified version');
            this.pdfProcessor = new PDFProcessorSimple();
            this.usingSimpleProcessor = true;
        }
        
        this.uiController = new UIController();
        this.downloadManager = new DownloadManager();
        
        this.currentPDF = null;
        this.currentFileName = '';
        this.splitResults = [];
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupSplitModeToggling();
        console.log('PDFSplit application initialized');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Logo click to go back to homepage
        const logoElement = document.querySelector('.logo');
        if (logoElement) {
            logoElement.addEventListener('click', () => {
                // Reload the page to return to the home state
                window.location.reload();
            });
            // Add cursor style to indicate clickable
            logoElement.style.cursor = 'pointer';
        }
        
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });

        // Upload area click
        document.getElementById('uploadArea').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // Split mode radio buttons
        document.querySelectorAll('input[name="splitMode"]').forEach(radio => {
            radio.addEventListener('change', this.handleSplitModeChange.bind(this));
        });

        // Action buttons
        document.getElementById('resetBtn')?.addEventListener('click', this.resetApp.bind(this));
        document.getElementById('splitBtn')?.addEventListener('click', this.handleSplit.bind(this));
        document.getElementById('newFileBtn')?.addEventListener('click', this.resetApp.bind(this));
        document.getElementById('downloadAllBtn')?.addEventListener('click', this.downloadAll.bind(this));
    }

    /**
     * Set up drag and drop functionality
     */
    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('dragover');
            }, false);
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        }, false);
    }

    /**
     * Set up split mode toggling
     */
    setupSplitModeToggling() {
        // This method is no longer needed as we've removed the automatic display of option details
        // when split mode changes
        console.log('Split mode toggling is disabled');
    }

    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(file) {
        try {
            // Validate file
            const validation = this.fileHandler.validateFile(file);
            if (!validation.isValid) {
                this.uiController.showError(validation.error);
                return;
            }

            this.currentFileName = file.name;
            this.uiController.showProgress(0, 'Reading PDF file...');
            
            // Read file
            const arrayBuffer = await this.fileHandler.readFile(file);
            this.uiController.updateProgress(30, 'Parsing PDF...');
            
            // Load PDF
            this.currentPDF = await this.pdfProcessor.loadPDF(arrayBuffer);
            this.uiController.updateProgress(60, 'Generating preview...');
            
            // Generate thumbnails
            const thumbnails = await this.generateThumbnails();
            this.uiController.updateProgress(90, 'Processing complete...');
            
            // Update UI
            this.updateFileInfo();
            this.displayThumbnails(thumbnails);
            this.uiController.hideProgress();
            this.uiController.showPreviewSection();
            
        } catch (error) {
            console.error('File upload error:', error);
            this.uiController.hideProgress();
            this.uiController.showError('Error processing PDF file: ' + error.message);
        }
    }

    /**
     * Generate PDF thumbnails
     */
    async generateThumbnails() {
        const thumbnails = [];
        const pageCount = this.currentPDF.getPageCount();
        
        if (this.usingSimpleProcessor) {
            console.log('Using simple processor - generating text-based thumbnails');
        }
        
        for (let i = 1; i <= pageCount; i++) {
            try {
                const thumbnail = await this.pdfProcessor.renderPage(this.currentPDF, i, 120);
                thumbnails.push({
                    pageNumber: i,
                    canvas: thumbnail, // Could be canvas or div element
                    isSimple: this.usingSimpleProcessor
                });
            } catch (error) {
                console.error(`Error generating thumbnail for page ${i}:`, error);
                // Create fallback thumbnail
                const fallbackDiv = document.createElement('div');
                fallbackDiv.textContent = `Page ${i}`;
                fallbackDiv.style.cssText = `
                    width: 120px; height: 150px; border: 2px solid #ccc;
                    display: flex; align-items: center; justify-content: center;
                    background: white; font-size: 14px; color: #666;
                `;
                thumbnails.push({
                    pageNumber: i,
                    canvas: fallbackDiv,
                    isSimple: true
                });
            }
        }
        
        return thumbnails;
    }

    /**
     * Display thumbnails in the grid
     */
    displayThumbnails(thumbnails) {
        const grid = document.getElementById('thumbnailsGrid');
        grid.innerHTML = '';
        
        // 设置grid的样式，确保它能够正确显示
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        grid.style.gap = '1rem';
        grid.style.maxHeight = '400px';
        grid.style.overflowY = 'auto';
        
        thumbnails.forEach(thumbnail => {
            const item = document.createElement('div');
            item.className = 'thumbnail-item';
            item.dataset.page = thumbnail.pageNumber;
            
            // 为每个缩略图项设置样式
            item.style.position = 'relative';
            item.style.borderRadius = 'var(--radius)';
            item.style.overflow = 'hidden';
            item.style.background = 'white';
            item.style.boxShadow = 'var(--shadow-sm)';
            item.style.transition = 'all var(--transition)';
            item.style.cursor = 'pointer';
            item.style.display = 'block';
            
            if (thumbnail.isSimple || thumbnail.canvas.tagName === 'DIV') {
                // Simple text-based thumbnail
                item.innerHTML = `
                    <div class="thumbnail-simple">${thumbnail.canvas.innerHTML || thumbnail.canvas.textContent}</div>
                    <div class="thumbnail-label">Page ${thumbnail.pageNumber}</div>
                `;
            } else {
                // Canvas-based thumbnail
                
                // 直接使用返回的canvas，而不是创建新的canvas并绘制
                if (thumbnail.canvas instanceof HTMLCanvasElement) {
                    // 为canvas设置适当的样式
                    thumbnail.canvas.className = 'thumbnail-canvas';
                    thumbnail.canvas.style.width = '100%';
                    thumbnail.canvas.style.height = 'auto';
                    thumbnail.canvas.style.display = 'block';
                    
                    // 添加标签元素
                    const label = document.createElement('div');
                    label.className = 'thumbnail-label';
                    label.textContent = `Page ${thumbnail.pageNumber}`;
                    label.style.position = 'absolute';
                    label.style.bottom = '0';
                    label.style.left = '0';
                    label.style.right = '0';
                    label.style.background = 'rgba(0, 0, 0, 0.7)';
                    label.style.color = 'white';
                    label.style.fontSize = 'var(--font-size-xs)';
                    label.style.padding = '0.25rem 0.5rem';
                    label.style.textAlign = 'center';
                    
                    // 将canvas和标签添加到item
                    item.appendChild(thumbnail.canvas);
                    item.appendChild(label);
                } else {
                    // 如果不是canvas，回退到简单缩略图
                    item.innerHTML = `
                        <div class="thumbnail-simple">Page ${thumbnail.pageNumber}</div>
                        <div class="thumbnail-label">Page ${thumbnail.pageNumber}</div>
                    `;
                }
            }
            
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
                this.updateSelectedPages();
            });
            
            grid.appendChild(item);
        });
    }

    /**
     * Update file information display
     */
    updateFileInfo() {
        const fileInfo = document.getElementById('fileInfo');
        const pageCount = this.currentPDF.getPageCount();
        fileInfo.textContent = `文件名: ${this.currentFileName} | 总页数: ${pageCount} 页`;
    }

    /**
     * Update selected pages display
     */
    updateSelectedPages() {
        const selectedThumbnails = document.querySelectorAll('.thumbnail-item.selected');
        const selectedPages = Array.from(selectedThumbnails).map(item => 
            parseInt(item.dataset.page)
        ).sort((a, b) => a - b);
        
        // Update extract pages input
        const extractPagesInput = document.getElementById('specificPages');
        if (extractPagesInput) {
            extractPagesInput.value = selectedPages.join(', ');
        }
    }

    /**
     * Handle split mode change
     */
    handleSplitModeChange(e) {
        const details = document.querySelectorAll('.option-details');
        
        // Only hide all details, no longer show any specific one
        details.forEach(detail => detail.style.display = 'none');
    }

    /**
     * Handle PDF splitting
     */
    async handleSplit() {
        if (!this.currentPDF) {
            this.uiController.showError('请先上传 PDF 文件');
            return;
        }

        try {
            this.uiController.showLoadingOverlay('正在分割 PDF...');
            
            const splitMode = document.querySelector('input[name="splitMode"]:checked').value;
            const splitOptions = this.getSplitOptions(splitMode);
            console.log('Starting split with mode:', splitMode, 'and options:', splitOptions);
            
            if (!splitOptions) {
                this.uiController.hideLoadingOverlay();
                return;
            }
            
            this.splitResults = await this.pdfProcessor.splitPDF(
                this.currentPDF, 
                splitMode, 
                splitOptions,
                this.currentFileName
            );
            
            this.displayResults();
            this.uiController.hideLoadingOverlay();
            this.uiController.showResultsSection();
            
        } catch (error) {
            console.error('Split error:', error);
            this.uiController.hideLoadingOverlay();
            this.uiController.showError('分割 PDF 时出错: ' + error.message);
        }
    }

    /**
     * Get split options based on selected mode
     */
    getSplitOptions(mode) {
        switch (mode) {
            case 'pages':
                const pagesPerFile = parseInt(document.getElementById('pagesPerFile').value);
                if (!pagesPerFile || pagesPerFile < 1) {
                    this.uiController.showError('请输入有效的页数');
                    return null;
                }
                return { pagesPerFile };
                
            case 'range':
                const pageRanges = document.getElementById('pageRanges').value;
                if (!pageRanges.trim()) {
                    this.uiController.showError('请输入页面范围');
                    return null;
                }
                return { ranges: this.parsePageRanges(pageRanges) };
                
            case 'extract':
                const specificPages = document.getElementById('specificPages').value;
                if (!specificPages.trim()) {
                    this.uiController.showError('请选择要提取的页面');
                    return null;
                }
                return { pages: this.parsePageNumbers(specificPages) };
                
            case 'parity':
                const includeOddPages = document.getElementById('includeOddPages').checked;
                const includeEvenPages = document.getElementById('includeEvenPages').checked;
                
                if (!includeOddPages && !includeEvenPages) {
                    this.uiController.showError('Please select at least one page type (odd or even)');
                    return null;
                }
                
                return { includeOddPages, includeEvenPages };
                
            default:
                return null;
        }
    }

    /**
     * Parse page ranges string
     */
    parsePageRanges(rangesString) {
        const ranges = [];
        const parts = rangesString.split(',');
        
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
                if (start && end && start <= end) {
                    ranges.push({ start, end });
                }
            } else {
                const pageNum = parseInt(trimmed);
                if (pageNum) {
                    ranges.push({ start: pageNum, end: pageNum });
                }
            }
        }
        
        return ranges;
    }

    /**
     * Parse page numbers string
     */
    parsePageNumbers(pagesString) {
        return pagesString.split(',')
            .map(p => parseInt(p.trim()))
            .filter(p => p > 0)
            .sort((a, b) => a - b);
    }

    /**
     * Display split results
     */
    displayResults() {
        const downloadList = document.getElementById('downloadList');
        downloadList.innerHTML = '';
        
        console.log('Split results array:', this.splitResults);
        
        this.splitResults.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'download-item';
            
            item.innerHTML = `
                <div class="download-info">
                    <svg class="download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                    <div class="download-details">
                        <h4>${result.filename}</h4>
                        <p>${result.pageInfo} | ${this.formatFileSize(result.size)}</p>
                    </div>
                </div>
                <a href="${result.url}" download="${result.filename}" class="download-btn">下载</a>
            `;
            
            downloadList.appendChild(item);
        });
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Download all split files
     */
    async downloadAll() {
        for (const result of this.splitResults) {
            const link = document.createElement('a');
            link.href = result.url;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Add small delay to prevent browser from blocking downloads
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Reset application to initial state
     */
    resetApp() {
        // Clear data
        this.currentPDF = null;
        this.currentFileName = '';
        this.splitResults = [];
        
        // Reset form
        document.getElementById('fileInput').value = '';
        document.getElementById('pagesPerFile').value = '1';
        document.getElementById('pageRanges').value = '';
        document.getElementById('specificPages').value = '';
        document.querySelector('input[name="splitMode"][value="pages"]').checked = true;
        
        // Reset UI
        this.uiController.hideProgress();
        this.uiController.hideError();
        this.uiController.hidePreviewSection();
        this.uiController.hideResultsSection();
        this.uiController.showUploadSection();
        
        // Clear thumbnails
        document.getElementById('thumbnailsGrid').innerHTML = '';
        
        // Clean up blob URLs
        this.splitResults.forEach(result => {
            if (result.url) {
                URL.revokeObjectURL(result.url);
            }
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PDFSplitApp();
});