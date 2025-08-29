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
            
            // Check if PDF.js is available, if not provide friendly error message and allow fallback to simple version
            if (typeof pdfjsLib === 'undefined') {
                console.warn('PDF.js library not loaded in PDFProcessor');
                // No longer throw error here, fallback logic is handled in main.js
                // Create a basic PDF object using only pdf-lib functionality
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
            
            // Provide more detailed error information and suggestions
            let errorMessage = 'PDF processing failed';
            
            // Provide specific error messages for different types of errors
            if (error.message.includes('Invalid PDF') || error.name === 'InvalidPDFException') {
                errorMessage = 'Invalid PDF format. Please ensure the file is not corrupted and is a standard PDF format';
            } else if (error.message.includes('password') || error.name === 'PasswordException') {
                errorMessage = 'Encrypted PDF files are not supported. Please decrypt the file before attempting to split';
            } else if (error.message.includes('compressed')) {
                errorMessage = 'This PDF compression format is not supported. Please try using a different version of the PDF file';
            } else if (error.name === 'MissingPDFException') {
                errorMessage = 'Not a valid PDF format. Please check that the file extension is .pdf';
            } else if (error.name === 'UnexpectedResponseException') {
                errorMessage = 'Network error. Please check your connection and try again';
            } else if (error.message.includes('Cannot read properties')) {
                errorMessage = 'PDF library failed to load. Please refresh the page and try again or use a different browser';
            } else if (error.message.includes('PDFLib is not defined') || error.message.includes('pdfjsLib is not defined')) {
                errorMessage = 'PDF processing libraries not loaded correctly. Please refresh the page or try again later';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'PDF processing timeout. Please try using a smaller PDF file';
            } else if (error.message.includes('Unsupported feature')) {
                errorMessage = 'PDF contains unsupported features. Please try using a different version of the PDF file';
            } else {
                // Default error message with general suggestions
                errorMessage = `Error processing PDF file: ${error.message}. Suggestions: Try using a different PDF file, check if the file is corrupted, or try using a different browser.`;
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
            throw new Error(`Failed to render page ${pageNum}`);
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
                throw new Error('Unsupported split mode');
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
            const pageInfo = `Pages ${startPage + 1}-${endPage + 1}`;
            
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
            const pageInfo = `Pages ${range.start}-${range.end}`;
            
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
            throw new Error('No valid pages to extract');
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
        const pageInfo = `Pages ${validPages.join(', ')}`;
        
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