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
        const splitModes = document.querySelectorAll('input[name="splitMode"]');
        
        splitModes.forEach(mode => {
            mode.addEventListener('change', () => {
                // Hide all option details
                document.querySelectorAll('.option-details').forEach(detail => {
                    detail.style.display = 'none';
                });
                
                // Show selected mode details
                const selectedDetails = document.getElementById(mode.value === 'pages' ? 'splitByPagesDetails' : 
                                                              mode.value === 'range' ? 'splitByRangeDetails' : 
                                                              'extractPagesDetails');
                if (selectedDetails) {
                    selectedDetails.style.display = 'block';
                }
            });
        });
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
            this.uiController.showProgress(0, '正在读取 PDF 文件...');
            
            // Read file
            const arrayBuffer = await this.fileHandler.readFile(file);
            this.uiController.updateProgress(30, '正在解析 PDF...');
            
            // Load PDF
            this.currentPDF = await this.pdfProcessor.loadPDF(arrayBuffer);
            this.uiController.updateProgress(60, '正在生成预览...');
            
            // Generate thumbnails
            const thumbnails = await this.generateThumbnails();
            this.uiController.updateProgress(90, '完成处理...');
            
            // Update UI
            this.updateFileInfo();
            this.displayThumbnails(thumbnails);
            this.uiController.hideProgress();
            this.uiController.showPreviewSection();
            
        } catch (error) {
            console.error('File upload error:', error);
            this.uiController.hideProgress();
            this.uiController.showError('处理 PDF 文件时出错: ' + error.message);
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
                fallbackDiv.textContent = `第 ${i} 页`;
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
        
        thumbnails.forEach(thumbnail => {
            const item = document.createElement('div');
            item.className = 'thumbnail-item';
            item.dataset.page = thumbnail.pageNumber;
            
            if (thumbnail.isSimple || thumbnail.canvas.tagName === 'DIV') {
                // Simple text-based thumbnail
                item.innerHTML = `
                    <div class="thumbnail-simple">${thumbnail.canvas.innerHTML || thumbnail.canvas.textContent}</div>
                    <div class="thumbnail-label">第 ${thumbnail.pageNumber} 页</div>
                `;
            } else {
                // Canvas-based thumbnail
                item.innerHTML = `
                    <canvas class="thumbnail-canvas"></canvas>
                    <div class="thumbnail-label">第 ${thumbnail.pageNumber} 页</div>
                `;
                
                try {
                    const canvas = item.querySelector('.thumbnail-canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = thumbnail.canvas.width;
                    canvas.height = thumbnail.canvas.height;
                    ctx.drawImage(thumbnail.canvas, 0, 0);
                } catch (error) {
                    console.warn('Failed to draw canvas thumbnail:', error);
                    // Fallback to simple thumbnail
                    item.innerHTML = `
                        <div class="thumbnail-simple">第 ${thumbnail.pageNumber} 页</div>
                        <div class="thumbnail-label">第 ${thumbnail.pageNumber} 页</div>
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
        const mode = e.target.value;
        const details = document.querySelectorAll('.option-details');
        
        details.forEach(detail => detail.style.display = 'none');
        
        switch (mode) {
            case 'pages':
                document.getElementById('splitByPagesDetails').style.display = 'block';
                break;
            case 'range':
                document.getElementById('splitByRangeDetails').style.display = 'block';
                break;
            case 'extract':
                document.getElementById('extractPagesDetails').style.display = 'block';
                break;
        }
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