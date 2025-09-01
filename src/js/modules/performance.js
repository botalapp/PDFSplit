/**
 * PDFSplit - Performance Optimization Module
 * Optimizations for SEO, Core Web Vitals, and overall user experience
 */

class PerformanceOptimizer {
    constructor() {
        this.initialize();
    }

    /**
     * Initialize performance optimizations
     */
    initialize() {
        // Only apply optimizations on the client-side
        if (typeof window === 'undefined') return;

        // Start performance measurement
        this.startPerformanceMonitoring();

        // Set up event listeners for performance tracking
        this.setupPerformanceListeners();

        // Apply lazy loading to images and thumbnails
        this.setupLazyLoading();

        // Optimize for core web vitals
        this.optimizeCoreWebVitals();

        // Add no-JS fallback detection
        this.addNoJSFallback();

        // Add structured data updates based on user actions
        this.setupStructuredDataUpdates();
    }

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        if ('performance' in window && 'mark' in performance) {
            performance.mark('app-start');

            // Log first contentful paint when it occurs
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((entries) => {
                        entries.getEntries().forEach((entry) => {
                            // Log FCP for analytics
                            if (entry.name === 'first-contentful-paint') {
                                // Send to Google Analytics if available
                                if (typeof gtag !== 'undefined') {
                                    gtag('event', 'first_contentful_paint', {
                                        'event_category': 'Performance',
                                        'value': Math.round(entry.startTime)
                                    });
                                }
                            }
                        });
                    });
                    observer.observe({ entryTypes: ['paint'] });
                } catch (e) {
                    console.warn('PerformanceObserver initialization failed:', e);
                }
            }
        }
    }

    /**
     * Set up event listeners for performance tracking
     */
    setupPerformanceListeners() {
        // Track when the application is fully loaded
        window.addEventListener('load', () => {
            this.logPerformanceMetrics();
        });

        // Track when the application becomes interactive
        document.addEventListener('DOMContentLoaded', () => {
            if ('performance' in window && 'mark' in performance) {
                performance.mark('dom-loaded');
            }
        });
    }

    /**
     * Log performance metrics
     */
    logPerformanceMetrics() {
        if ('performance' in window && 'getEntriesByType' in performance) {
            const navEntries = performance.getEntriesByType('navigation');
            if (navEntries.length > 0) {
                const navEntry = navEntries[0];
                
                // Log performance metrics if analytics is available
                if (typeof gtag !== 'undefined') {
                    // Log page load time
                    gtag('event', 'page_load_time', {
                        'event_category': 'Performance',
                        'value': Math.round(navEntry.loadEventEnd - navEntry.startTime)
                    });
                    
                    // Log DOMContentLoaded time
                    gtag('event', 'dom_content_loaded', {
                        'event_category': 'Performance',
                        'value': Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime)
                    });
                }
            }
        }
    }

    /**
     * Set up lazy loading for images and thumbnails
     */
    setupLazyLoading() {
        // Add lazy loading attribute to thumbnails when they're created
        // This will be integrated with the PDFSplitApp
        
        // Add intersection observer for lazy loading if supported
        if ('IntersectionObserver' in window) {
            // We'll use this in the main app for observing thumbnails
        }
    }

    /**
     * Optimize for Core Web Vitals
     */
    optimizeCoreWebVitals() {
        // Optimize for Largest Contentful Paint (LCP)
        this.optimizeLCP();
        
        // Optimize for Cumulative Layout Shift (CLS)
        this.optimizeCLS();
        
        // Optimize for First Input Delay (FID)
        this.optimizeFID();
    }

    /**
     * Optimize for Largest Contentful Paint (LCP)
     */
    optimizeLCP() {
        // Ensure text remains visible during webfont load
        document.fonts.ready.then(() => {
            // Fonts are loaded
        });
    }

    /**
     * Optimize for Cumulative Layout Shift (CLS)
     */
    optimizeCLS() {
        // Set dimensions for images and media elements
        const setupImageDimensions = () => {
            document.querySelectorAll('img, canvas').forEach(element => {
                if (!element.width || !element.height) {
                    // Set aspect ratio to prevent layout shifts
                    if (element.naturalWidth && element.naturalHeight) {
                        const aspectRatio = element.naturalHeight / element.naturalWidth;
                        element.style.aspectRatio = `${element.naturalWidth} / ${element.naturalHeight}`;
                    }
                }
            });
        };

        // Run when DOM is loaded and when window resizes
        window.addEventListener('load', setupImageDimensions);
        window.addEventListener('resize', setupImageDimensions);
    }

    /**
     * Optimize for First Input Delay (FID)
     */
    optimizeFID() {
        // Defer non-critical JavaScript execution
        this.deferNonCriticalTasks();
    }

    /**
     * Defer non-critical tasks to improve FID
     */
    deferNonCriticalTasks() {
        // Function to run tasks after the main thread is idle
        const idleCallback = window.requestIdleCallback || ((callback) => {
            const start = Date.now();
            return setTimeout(() => {
                callback({
                    didTimeout: false,
                    timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
                });
            }, 1);
        });

        // Queue non-critical tasks
        idleCallback(() => {
            // Example: Preload resources for next likely user actions
            if (document.getElementById('uploadArea')) {
                // Preload processing modules in anticipation of file upload
                this.preloadCriticalResources();
            }
        });
    }

    /**
     * Preload critical resources for upcoming user actions
     */
    preloadCriticalResources() {
        // This will be called when the user is likely to need additional resources
    }

    /**
     * Add no-JS fallback detection
     */
    addNoJSFallback() {
        // Remove no-js class if JavaScript is enabled
        document.documentElement.classList.remove('no-js');
        document.documentElement.classList.add('js');

        // Add structured data for JavaScript availability
        this.updateStructuredData({
            hasJavaScript: true
        });
    }

    /**
     * Set up structured data updates based on user actions
     */
    setupStructuredDataUpdates() {
        // This will be used to update structured data dynamically
        // based on user interactions like file uploads, processing, etc.
    }

    /**
     * Update structured data on the page
     */
    updateStructuredData(data) {
        try {
            const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
            scriptTags.forEach(tag => {
                try {
                    const jsonData = JSON.parse(tag.textContent);
                    
                    // Update relevant fields based on the data provided
                    if (data.hasJavaScript !== undefined && jsonData['@type'] === 'SoftwareApplication') {
                        jsonData.operatingSystem = jsonData.operatingSystem || '';
                        if (jsonData.operatingSystem && !jsonData.operatingSystem.includes('JavaScript')) {
                            jsonData.operatingSystem += '; JavaScript';
                        } else if (!jsonData.operatingSystem) {
                            jsonData.operatingSystem = 'JavaScript';
                        }
                    }
                    
                    // Convert back to string and update the script tag
                    tag.textContent = JSON.stringify(jsonData);
                } catch (e) {
                    // Ignore parsing errors for other structured data blocks
                }
            });
        } catch (e) {
            console.warn('Failed to update structured data:', e);
        }
    }

    /**
     * Log conversion events for SEO
     */
    logConversionEvent(eventName) {
        // Log conversion events for analytics and SEO purposes
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                'event_category': 'Conversion',
                'event_label': 'PDF Processing'
            });
        }
    }

    /**
     * Clean up resources to prevent memory leaks
     */
    cleanup() {
        // Clean up performance observers if needed
        // This would be called when the application is reset or closed
    }
}

export { PerformanceOptimizer };