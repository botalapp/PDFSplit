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
            // Set worker source
            if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.js';
            }
            console.log('PDF.js initialized with worker:', pdfjsLib.GlobalWorkerOptions.workerSrc);
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
        console.log('Starting PDF loading...', { 
            bufferSize: buffer?.byteLength,
            PDFLibAvailable: typeof PDFLib !== 'undefined',
            pdfjsLibAvailable: typeof pdfjsLib !== 'undefined'
        });

        try {
            // Check if libraries are loaded
            if (typeof PDFLib === 'undefined') {
                throw new Error('PDF-lib library not loaded');
            }
            
            // 检查PDF.js是否可用，如果不可用，提供更友好的错误信息并允许回退到简化版
            if (typeof pdfjsLib === 'undefined') {
                console.warn('PDF.js library not loaded in PDFProcessor');
                // 这里不再抛出错误，而是在main.js中已经处理了回退逻辑
                // 创建一个基本的PDF对象，只使用pdf-lib功能
                const pdfDoc = await PDFLib.PDFDocument.load(buffer);
                return {
                    pdfLib: pdfDoc,
                    pdfJS: null,
                    getPageCount: () => pdfDoc.getPageCount(),
                    buffer: buffer,
                    isSimplified: true
                };
            }

            console.log('Loading PDF with pdf-lib...');
            // Load with pdf-lib for manipulation
            const pdfDoc = await PDFLib.PDFDocument.load(buffer);
            console.log('pdf-lib loaded successfully, pages:', pdfDoc.getPageCount());
            
            console.log('Loading PDF with PDF.js...');
            // Load with PDF.js for rendering - with timeout
            const uint8Array = new Uint8Array(buffer);
            console.log('Created Uint8Array, size:', uint8Array.length);
            
            const loadingTask = pdfjsLib.getDocument({
                data: uint8Array,
                verbosity: 1
            });
            
            console.log('Created loading task, waiting for promise...');
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('PDF.js loading timeout')), 10000)
            );
            
            const pdfViewer = await Promise.race([
                loadingTask.promise,
                timeoutPromise
            ]);
            
            console.log('PDF.js loaded successfully, pages:', pdfViewer.numPages);
            
            const result = {
                pdfLib: pdfDoc,
                pdfJS: pdfViewer,
                getPageCount: () => pdfDoc.getPageCount(),
                buffer: buffer
            };
            
            console.log('PDF loading completed successfully');
            return result;
        } catch (error) {
            console.error('PDF loading error details:', {
                error: error,
                message: error.message,
                name: error.name,
                stack: error.stack,
                bufferSize: buffer ? buffer.byteLength : 'no buffer'
            });
            
            // 提供更详细的错误信息和处理建议
            let errorMessage = 'PDF 处理失败';
            
            // 针对不同类型的错误提供具体的错误信息
            if (error.message.includes('Invalid PDF') || error.name === 'InvalidPDFException') {
                errorMessage = 'PDF 文件格式无效，请确保文件没有损坏且是标准 PDF 格式';
            } else if (error.message.includes('password') || error.name === 'PasswordException') {
                errorMessage = '不支持加密的 PDF 文件，请先解密后再尝试分割';
            } else if (error.message.includes('compressed')) {
                errorMessage = '不支持此 PDF 压缩格式，请尝试使用其他版本的 PDF 文件';
            } else if (error.name === 'MissingPDFException') {
                errorMessage = '文件不是有效的 PDF 格式，请检查文件扩展名是否为.pdf';
            } else if (error.name === 'UnexpectedResponseException') {
                errorMessage = '网络错误，请检查网络连接后重试';
            } else if (error.message.includes('Cannot read properties')) {
                errorMessage = 'PDF 库加载失败，请刷新页面重试或使用其他浏览器';
            } else if (error.message.includes('PDFLib is not defined') || error.message.includes('pdfjsLib is not defined')) {
                errorMessage = 'PDF 处理库未正确加载，请刷新页面或稍后再试';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'PDF 处理超时，请尝试使用较小的 PDF 文件';
            } else if (error.message.includes('Unsupported feature')) {
                errorMessage = 'PDF 包含不支持的特性，请尝试使用其他版本的 PDF 文件';
            } else {
                // 默认错误信息，增加一些通用建议
                errorMessage = `处理 PDF 文件时出错: ${error.message}。建议：尝试使用其他 PDF 文件、检查文件是否损坏或尝试使用不同的浏览器。`;
            }
            
            throw new Error(errorMessage);
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