/**
 * Simplified PDF Processor Module
 * Uses only pdf-lib for both processing and basic preview
 */

export class PDFProcessorSimple {
    constructor() {
        console.log('PDFProcessorSimple initialized');
    }

    /**
     * Load PDF from ArrayBuffer (simplified version)
     * @param {ArrayBuffer} buffer - PDF file buffer
     * @returns {Promise<Object>} PDF document object
     */
    async loadPDF(buffer) {
        console.log('Loading PDF with pdf-lib only...', { bufferSize: buffer?.byteLength });

        try {
            if (typeof PDFLib === 'undefined') {
                throw new Error('PDF-lib library not loaded');
            }

            // Load with pdf-lib only
            const pdfDoc = await PDFLib.PDFDocument.load(buffer);
            const pageCount = pdfDoc.getPageCount();
            
            console.log('PDF loaded successfully:', { pageCount });
            
            return {
                pdfLib: pdfDoc,
                pdfJS: null, // We'll skip PDF.js for now
                getPageCount: () => pageCount,
                buffer: buffer
            };
        } catch (error) {
            console.error('PDF loading error in simple processor:', {
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
            } else if (error.name === 'MissingPDFException') {
                errorMessage = '文件不是有效的 PDF 格式，请检查文件扩展名是否为.pdf';
            } else if (error.message.includes('Cannot read properties')) {
                errorMessage = 'PDF 库加载失败，请刷新页面重试';
            } else if (error.message.includes('PDFLib is not defined')) {
                errorMessage = 'PDF 处理库未正确加载，请刷新页面';
            } else {
                // 默认错误信息，增加一些通用建议
                errorMessage = `处理 PDF 文件时出错: ${error.message}。建议：尝试使用其他 PDF 文件、检查文件是否损坏或尝试使用不同的浏览器。`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Create simple text-based page thumbnails
     * @param {Object} pdf - PDF document
     * @param {number} pageNum - Page number
     * @returns {Promise<HTMLElement>} Simple page representation
     */
    async renderPage(pdf, pageNum) {
        try {
            // Create a simple div representing the page
            const pageDiv = document.createElement('div');
            pageDiv.style.cssText = `
                width: 120px;
                height: 150px;
                border: 2px solid #ccc;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
                font-size: 14px;
                color: #666;
                text-align: center;
            `;
            pageDiv.innerHTML = `第 ${pageNum} 页`;
            
            return pageDiv;
        } catch (error) {
            console.error(`Error creating page ${pageNum}:`, error);
            throw new Error(`无法创建第 ${pageNum} 页预览`);
        }
    }

    /**
     * Split PDF by number of pages per file
     */
    async splitByPages(pdf, options, originalFilename) {
        const { pagesPerFile } = options;
        const totalPages = pdf.getPageCount();
        const results = [];
        
        console.log(`Splitting ${totalPages} pages into files of ${pagesPerFile} pages each`);
        
        for (let i = 0; i < totalPages; i += pagesPerFile) {
            const endPage = Math.min(i + pagesPerFile - 1, totalPages - 1);
            const startPage = i;
            
            console.log(`Creating file for pages ${startPage + 1}-${endPage + 1}`);
            
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
     */
    async splitByRanges(pdf, options, originalFilename) {
        const { ranges } = options;
        const results = [];
        const totalPages = pdf.getPageCount();
        
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const startPage = Math.max(1, range.start) - 1;
            const endPage = Math.min(range.end, totalPages) - 1;
            
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
     */
    async extractPages(pdf, options, originalFilename) {
        const { pages } = options;
        const totalPages = pdf.getPageCount();
        const validPages = pages.filter(p => p >= 1 && p <= totalPages);
        
        if (validPages.length === 0) {
            throw new Error('没有有效的页面可以提取');
        }
        
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
     * Split PDF based on mode
     */
    async splitPDF(pdf, mode, options, originalFilename) {
        console.log(`Starting PDF split with mode: ${mode}`, options);
        
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
     * Create new PDF from page range
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
     */
    createDownloadUrl(pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
    }

    /**
     * Generate filename with suffix
     */
    generateFilename(originalFilename, suffix) {
        const nameWithoutExt = originalFilename.replace(/\.pdf$/i, '');
        return `${nameWithoutExt}_${suffix}.pdf`;
    }
}