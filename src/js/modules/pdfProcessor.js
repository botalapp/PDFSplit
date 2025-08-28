/**
 * PDF Processor Module
 * Handles PDF operations using pdf-lib and PDF.js
 */

export class PDFProcessor {
    constructor() {
        this.pdfjsWorker = null;
        this.initializePDFJS();
    }

    /**
     * Initialize PDF.js
     */
    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            // PDF.js worker is already set up in HTML
            console.log('PDF.js initialized');
        } else {
            console.error('PDF.js not loaded');
        }
    }

    /**
     * Load PDF from ArrayBuffer
     * @param {ArrayBuffer} buffer - PDF file buffer
     * @returns {Promise<Object>} PDF document object
     */
    async loadPDF(buffer) {
        try {
            // Load with pdf-lib for manipulation
            const pdfDoc = await PDFLib.PDFDocument.load(buffer);
            
            // Load with PDF.js for rendering
            const loadingTask = pdfjsLib.getDocument(buffer);
            const pdfViewer = await loadingTask.promise;
            
            return {
                pdfLib: pdfDoc,
                pdfJS: pdfViewer,
                getPageCount: () => pdfDoc.getPageCount(),
                buffer: buffer
            };
        } catch (error) {
            console.error('PDF loading error:', error);
            throw new Error('PDF 文件损坏或格式不支持');
        }
    }

    /**
     * Render PDF page to canvas
     * @param {Object} pdf - PDF document
     * @param {number} pageNum - Page number (1-based)
     * @param {number} scale - Render scale
     * @returns {Promise<HTMLCanvasElement>} Rendered canvas
     */
    async renderPage(pdf, pageNum, scale = 1.0) {
        try {
            const page = await pdf.pdfJS.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            return canvas;
        } catch (error) {
            console.error(`Error rendering page ${pageNum}:`, error);
            throw new Error(`无法渲染第 ${pageNum} 页`);
        }
    }

    /**
     * Split PDF based on different modes
     * @param {Object} pdf - PDF document
     * @param {string} mode - Split mode
     * @param {Object} options - Split options
     * @param {string} originalFilename - Original filename
     * @returns {Promise<Array>} Split results
     */
    async splitPDF(pdf, mode, options, originalFilename) {
        switch (mode) {
            case 'pages':
                return this.splitByPages(pdf, options, originalFilename);
            case 'range':
                return this.splitByRanges(pdf, options, originalFilename);
            case 'extract':
                return this.extractPages(pdf, options, originalFilename);
            default:
                throw new Error('不支持的分割模式');
        }
    }

    /**
     * Split PDF by number of pages per file
     * @param {Object} pdf - PDF document
     * @param {Object} options - Split options
     * @param {string} originalFilename - Original filename
     * @returns {Promise<Array>} Split results
     */
    async splitByPages(pdf, options, originalFilename) {
        const { pagesPerFile } = options;
        const totalPages = pdf.getPageCount();
        const results = [];
        
        for (let i = 0; i < totalPages; i += pagesPerFile) {
            const endPage = Math.min(i + pagesPerFile - 1, totalPages - 1);
            const startPage = i;
            
            const newPDF = await this.createPDFFromPages(pdf.pdfLib, startPage, endPage);
            const pdfBytes = await newPDF.save();
            
            const suffix = `pages_${startPage + 1}-${endPage + 1}`;
            const filename = this.generateFilename(originalFilename, suffix);
            const url = this.createDownloadUrl(pdfBytes);
            const pageInfo = `第 ${startPage + 1}-${endPage + 1} 页`;
            
            results.push({
                filename,
                url,
                size: pdfBytes.length,
                pageInfo
            });
        }
        
        return results;
    }

    /**
     * Split PDF by page ranges
     * @param {Object} pdf - PDF document
     * @param {Object} options - Split options
     * @param {string} originalFilename - Original filename
     * @returns {Promise<Array>} Split results
     */
    async splitByRanges(pdf, options, originalFilename) {
        const { ranges } = options;
        const results = [];
        const totalPages = pdf.getPageCount();
        
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const startPage = Math.max(1, range.start) - 1; // Convert to 0-based
            const endPage = Math.min(range.end, totalPages) - 1; // Convert to 0-based
            
            if (startPage > endPage || startPage < 0 || endPage >= totalPages) {
                console.warn(`Invalid range: ${range.start}-${range.end}`);
                continue;
            }
            
            const newPDF = await this.createPDFFromPages(pdf.pdfLib, startPage, endPage);
            const pdfBytes = await newPDF.save();
            
            const suffix = `range_${range.start}-${range.end}`;
            const filename = this.generateFilename(originalFilename, suffix);
            const url = this.createDownloadUrl(pdfBytes);
            const pageInfo = `第 ${range.start}-${range.end} 页`;
            
            results.push({
                filename,
                url,
                size: pdfBytes.length,
                pageInfo
            });
        }
        
        return results;
    }

    /**
     * Extract specific pages
     * @param {Object} pdf - PDF document
     * @param {Object} options - Split options
     * @param {string} originalFilename - Original filename
     * @returns {Promise<Array>} Split results
     */
    async extractPages(pdf, options, originalFilename) {
        const { pages } = options;
        const totalPages = pdf.getPageCount();
        const validPages = pages.filter(p => p >= 1 && p <= totalPages);
        
        if (validPages.length === 0) {
            throw new Error('没有有效的页面可以提取');
        }
        
        // Convert to 0-based indices
        const pageIndices = validPages.map(p => p - 1);
        
        const newPDF = await PDFLib.PDFDocument.create();
        const copiedPages = await newPDF.copyPages(pdf.pdfLib, pageIndices);
        
        copiedPages.forEach(page => newPDF.addPage(page));
        
        const pdfBytes = await newPDF.save();
        const suffix = `extracted_pages_${validPages.join('-')}`;
        const filename = this.generateFilename(originalFilename, suffix);
        const url = this.createDownloadUrl(pdfBytes);
        const pageInfo = `第 ${validPages.join(', ')} 页`;
        
        return [{
            filename,
            url,
            size: pdfBytes.length,
            pageInfo
        }];
    }

    /**
     * Create new PDF from page range
     * @param {PDFDocument} sourcePDF - Source PDF document
     * @param {number} startPage - Start page (0-based)
     * @param {number} endPage - End page (0-based)
     * @returns {Promise<PDFDocument>} New PDF document
     */
    async createPDFFromPages(sourcePDF, startPage, endPage) {
        const newPDF = await PDFLib.PDFDocument.create();
        const pageIndices = [];
        
        for (let i = startPage; i <= endPage; i++) {
            pageIndices.push(i);
        }
        
        const copiedPages = await newPDF.copyPages(sourcePDF, pageIndices);
        copiedPages.forEach(page => newPDF.addPage(page));
        
        return newPDF;
    }

    /**
     * Create download URL from PDF bytes
     * @param {Uint8Array} pdfBytes - PDF byte array
     * @returns {string} Download URL
     */
    createDownloadUrl(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
    }

    /**
     * Generate filename with suffix
     * @param {string} originalFilename - Original filename
     * @param {string} suffix - Suffix to add
     * @returns {string} New filename
     */
    generateFilename(originalFilename, suffix) {
        const nameWithoutExt = originalFilename.replace(/\.pdf$/i, '');
        return `${nameWithoutExt}_${suffix}.pdf`;
    }

    /**
     * Get PDF metadata
     * @param {Object} pdf - PDF document
     * @returns {Object} PDF metadata
     */
    getPDFInfo(pdf) {
        return {
            pageCount: pdf.getPageCount(),
            title: pdf.pdfLib.getTitle() || '',
            author: pdf.pdfLib.getAuthor() || '',
            subject: pdf.pdfLib.getSubject() || '',
            creator: pdf.pdfLib.getCreator() || '',
            producer: pdf.pdfLib.getProducer() || ''
        };
    }
}