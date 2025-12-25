import jsPDF from 'jspdf';
import { Course } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PDF_CONFIG = {
    pageWidth: 210, // A4 width in mm
    pageHeight: 297, // A4 height in mm
    margin: 20,
    contentWidth: 170, // pageWidth - 2 * margin
    fontSize: {
        title: 24,
        h1: 18,
        h2: 14,
        h3: 12,
        body: 10,
        footer: 8,
    },
    lineHeight: {
        title: 1.2,
        heading: 1.3,
        body: 1.6,
    },
    colors: {
        primary: '#2563eb',
        text: '#1f2937',
        secondary: '#6b7280',
        light: '#9ca3af',
        dark: '#111827',
    },
    spacing: {
        afterTitle: 10,
        afterHeading: 6,
        afterParagraph: 5,
        beforeSection: 12,
    },
    fonts: {
        regular: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
        bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
        main: 'Roboto'
    }
};

// ============================================================================
// TYPES
// ============================================================================


interface ParsedElement {
    type: 'heading' | 'paragraph' | 'list' | 'image' | 'code';
    level?: number; // For headings (1-3)
    content: string;
    items?: string[]; // For lists
    ordered?: boolean; // For lists
    url?: string; // For images
}

// ============================================================================
// HELPER FUNCTIONS - DOCUMENT STRUCTURE
// ============================================================================

/**
 * Loads custom fonts for the PDF document
 */
async function loadFonts(doc: jsPDF): Promise<void> {
    const loadFont = async (url: string, name: string, style: string) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch font: ${res.statusText}`);
            const blob = await res.blob();
            return new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1];
                    if (base64) {
                        doc.addFileToVFS(`${name}-${style}.ttf`, base64);
                        doc.addFont(`${name}-${style}.ttf`, name, style);
                        resolve();
                    } else {
                        reject(new Error('Failed to parse font data'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn(`Failed to load font ${name} ${style}:`, e);
        }
    };

    await Promise.all([
        loadFont(PDF_CONFIG.fonts.regular, PDF_CONFIG.fonts.main, 'normal'),
        loadFont(PDF_CONFIG.fonts.bold, PDF_CONFIG.fonts.main, 'bold')
    ]);
}

/**
 * Creates a new PDF document with default settings
 */
function createPdfDocument(): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    // Set default font (will be overridden after loading custom fonts)
    doc.setFont('helvetica');
    doc.setFontSize(PDF_CONFIG.fontSize.body);
    doc.setTextColor(PDF_CONFIG.colors.text);

    return doc;
}

/**
 * Adds page numbers to all pages
 */
function addPageNumbers(doc: jsPDF, courseTitle: string): void {
    const pageCount = (doc as unknown as { getNumberOfPages: () => number }).getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Skip page number on first page (title page)
        if (i === 1) continue;

        // Footer text
        doc.setFontSize(PDF_CONFIG.fontSize.footer);
        doc.setTextColor(PDF_CONFIG.colors.light);

        // Course title on left
        doc.text(
            courseTitle.substring(0, 50),
            PDF_CONFIG.margin,
            PDF_CONFIG.pageHeight - 10
        );

        // Page number on right
        doc.text(
            `Page ${i - 1} of ${pageCount - 1}`,
            PDF_CONFIG.pageWidth - PDF_CONFIG.margin,
            PDF_CONFIG.pageHeight - 10,
            { align: 'right' }
        );
    }
}

/**
 * Checks if we need a page break and adds one if necessary
 * Returns the new Y position
 */
function checkPageBreak(
    doc: jsPDF,
    currentY: number,
    requiredSpace: number
): number {
    const maxY = PDF_CONFIG.pageHeight - PDF_CONFIG.margin;

    if (currentY + requiredSpace > maxY) {
        doc.addPage();
        return PDF_CONFIG.margin;
    }

    return currentY;
}

// ============================================================================
// HELPER FUNCTIONS - TEXT RENDERING
// ============================================================================

/**
 * Adds formatted text to the PDF
 */


// ============================================================================
// HELPER FUNCTIONS - MARKDOWN PARSING
// ============================================================================

/**
 * Parses markdown content into structured elements
 */
function parseMarkdown(markdown: string): ParsedElement[] {
    const elements: ParsedElement[] = [];
    const lines = markdown.split('\n');

    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) {
            i++;
            continue;
        }

        // Headings
        if (line.startsWith('#')) {
            const match = line.match(/^(#{1,3})\s+(.+)$/);
            if (match) {
                elements.push({
                    type: 'heading',
                    level: match[1].length,
                    content: match[2],
                });
                i++;
                continue;
            }
        }

        // Unordered lists
        if (line.match(/^[-*]\s+/)) {
            const items: string[] = [];
            while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
                items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
                i++;
            }
            elements.push({
                type: 'list',
                items,
                ordered: false,
                content: '',
            });
            continue;
        }

        // Ordered lists
        if (line.match(/^\d+\.\s+/)) {
            const items: string[] = [];
            while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
                items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
                i++;
            }
            elements.push({
                type: 'list',
                items,
                ordered: true,
                content: '',
            });
            continue;
        }

        // Images
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
            elements.push({
                type: 'image',
                content: imageMatch[1], // alt text
                url: imageMatch[2],
            });
            i++;
            continue;
        }

        // Code blocks
        if (line.startsWith('```')) {
            const codeLines: string[] = [];
            i++; // Skip opening ```
            while (i < lines.length && !lines[i].trim().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // Skip closing ```
            elements.push({
                type: 'code',
                content: codeLines.join('\n'),
            });
            continue;
        }

        // Regular paragraph
        let paragraph = line;
        i++;
        // Collect consecutive non-empty lines as part of the same paragraph
        while (
            i < lines.length &&
            lines[i].trim() &&
            !lines[i].trim().startsWith('#') &&
            !lines[i].trim().match(/^[-*]\s+/) &&
            !lines[i].trim().match(/^\d+\.\s+/) &&
            !lines[i].trim().startsWith('```')
        ) {
            paragraph += ' ' + lines[i].trim();
            i++;
        }

        elements.push({
            type: 'paragraph',
            content: paragraph,
        });
    }

    return elements;
}

/**
 * Strips markdown formatting from text (bold, italic, code)
 */
function stripMarkdownFormatting(text: string): string {
    let stripped = text
        .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
        .replace(/\*(.+?)\*/g, '$1') // Italic
        .replace(/__(.+?)__/g, '$1') // Bold (alternative)
        .replace(/_(.+?)_/g, '$1') // Italic (alternative)
        .replace(/`(.+?)`/g, '$1') // Inline code
        .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
        .replace(/\\([*_`\[\]\\])/g, '$1'); // Unescape escaped characters

    // Fix placeholders: convert [\\\\\\], [______], or [\_\_\_\_\_] to clean [______]
    stripped = stripped.replace(/\[([\\_]+)\]/g, (match, content) => {
        // If the content is just backslashes or mixed chars, replace with underscores
        // We use a heuristic for length: if it looks escaped (has backslashes), 
        // we might want to reduce length, but preserving length is safer for layout.
        // Simple approach: replace all characters with underscores.
        return '[' + '_'.repeat(content.length) + ']';
    });

    return stripped;
}

// ============================================================================
// HELPER FUNCTIONS - IMAGE HANDLING
// ============================================================================

/**
 * Fetches an image and converts it to a data URL
 */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to fetch image:', url, error);
        return null;
    }
}

/**
 * Embeds an image in the PDF
 */
async function embedImage(
    doc: jsPDF,
    imageUrl: string,
    x: number,
    y: number,
    maxWidth: number = PDF_CONFIG.contentWidth
): Promise<number> {
    try {
        const dataUrl = await fetchImageAsDataUrl(imageUrl);
        if (!dataUrl) return y;

        // Get image dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = dataUrl;
        });

        // Calculate scaled dimensions
        const aspectRatio = img.width / img.height;
        let width = maxWidth;
        let height = width / aspectRatio;

        // If height is too large, scale down
        const maxHeight = 100; // mm
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        // Add image to PDF
        doc.addImage(dataUrl, 'JPEG', x, y, width, height);

        // Return Y position after image
        return y + height + PDF_CONFIG.spacing.afterParagraph;
    } catch (error) {
        console.error('Failed to embed image:', imageUrl, error);
        return y;
    }
}

// ============================================================================
// PAGE GENERATORS
// ============================================================================

/**
 * Adds the title page
 */
function addTitlePage(doc: jsPDF, course: Course): void {
    const centerX = PDF_CONFIG.pageWidth / 2;
    let y = 80;

    // Course title
    doc.setFontSize(PDF_CONFIG.fontSize.title);
    doc.setFont(PDF_CONFIG.fonts.main, 'bold');
    doc.setTextColor(PDF_CONFIG.colors.primary);

    const titleLines = doc.splitTextToSize(course.title, PDF_CONFIG.contentWidth);
    titleLines.forEach((line: string) => {
        doc.text(line, centerX, y, { align: 'center' });
        y += PDF_CONFIG.fontSize.title * PDF_CONFIG.lineHeight.title * 0.352778;
    });

    y += 15;

    // Subject
    if (course.subject) {
        doc.setFontSize(PDF_CONFIG.fontSize.h2);
        doc.setFont(PDF_CONFIG.fonts.main, 'normal');
        doc.setTextColor(PDF_CONFIG.colors.secondary);
        doc.text(course.subject, centerX, y, { align: 'center' });
        y += 10;
    }

    // Target audience
    if (course.target_audience) {
        doc.setFontSize(PDF_CONFIG.fontSize.body);
        doc.setTextColor(PDF_CONFIG.colors.text);
        doc.text(`Target Audience: ${course.target_audience}`, centerX, y, {
            align: 'center',
        });
        y += 8;
    }

    // Environment
    doc.text(`Environment: ${course.environment}`, centerX, y, {
        align: 'center',
    });
    y += 8;

    // Language
    doc.text(`Language: ${course.language}`, centerX, y, { align: 'center' });
    y += 20;

    // Generation date
    doc.setFontSize(PDF_CONFIG.fontSize.footer);
    doc.setTextColor(PDF_CONFIG.colors.light);
    const date = new Date().toLocaleDateString();
    doc.text(`Generated on ${date}`, centerX, y, { align: 'center' });
}

/**
 * Adds table of contents
 */
function addTableOfContents(doc: jsPDF, course: Course): void {
    doc.addPage();

    let y = PDF_CONFIG.margin;

    // TOC Title
    doc.setFontSize(PDF_CONFIG.fontSize.h1);
    doc.setFont(PDF_CONFIG.fonts.main, 'bold');
    doc.setTextColor(PDF_CONFIG.colors.primary);
    doc.text('Table of Contents', PDF_CONFIG.margin, y);

    y += PDF_CONFIG.spacing.afterTitle;

    // List course steps
    doc.setFontSize(PDF_CONFIG.fontSize.body);
    doc.setFont(PDF_CONFIG.fonts.main, 'normal');
    doc.setTextColor(PDF_CONFIG.colors.text);

    if (course.steps && course.steps.length > 0) {
        course.steps.forEach((step, index) => {
            y = checkPageBreak(doc, y, 10);

            const stepNumber = `${index + 1}.`;
            const stepTitle = stripMarkdownFormatting(step.title_key);

            doc.text(stepNumber, PDF_CONFIG.margin, y);
            doc.text(stepTitle, PDF_CONFIG.margin + 10, y);

            y += 7;
        });
    }
}

/**
 * Renders parsed markdown elements to PDF
 */
async function renderMarkdownElements(
    doc: jsPDF,
    elements: ParsedElement[],
    startY: number
): Promise<number> {
    let y = startY;

    for (const element of elements) {
        // Check for page break before each element
        y = checkPageBreak(doc, y, 20);

        switch (element.type) {
            case 'heading': {
                const fontSize =
                    element.level === 1
                        ? PDF_CONFIG.fontSize.h1
                        : element.level === 2
                            ? PDF_CONFIG.fontSize.h2
                            : PDF_CONFIG.fontSize.h3;

                y += PDF_CONFIG.spacing.beforeSection;
                y = checkPageBreak(doc, y, fontSize * 2);

                doc.setFontSize(fontSize);
                doc.setFont(PDF_CONFIG.fonts.main, 'bold');
                doc.setTextColor(PDF_CONFIG.colors.primary);

                const headingText = stripMarkdownFormatting(element.content);
                const lines = doc.splitTextToSize(headingText, PDF_CONFIG.contentWidth);
                lines.forEach((line: string) => {
                    doc.text(line, PDF_CONFIG.margin, y);
                    y += fontSize * PDF_CONFIG.lineHeight.heading * 0.352778;
                });

                y += PDF_CONFIG.spacing.afterHeading;
                break;
            }

            case 'paragraph': {
                doc.setFontSize(PDF_CONFIG.fontSize.body);
                doc.setFont(PDF_CONFIG.fonts.main, 'normal');
                doc.setTextColor(PDF_CONFIG.colors.text);

                const paragraphText = stripMarkdownFormatting(element.content);
                const lines = doc.splitTextToSize(paragraphText, PDF_CONFIG.contentWidth);

                lines.forEach((line: string) => {
                    y = checkPageBreak(doc, y, 10);
                    doc.text(line, PDF_CONFIG.margin, y);
                    y += PDF_CONFIG.fontSize.body * PDF_CONFIG.lineHeight.body * 0.352778;
                });

                y += PDF_CONFIG.spacing.afterParagraph;
                break;
            }

            case 'list': {
                doc.setFontSize(PDF_CONFIG.fontSize.body);
                doc.setFont(PDF_CONFIG.fonts.main, 'normal');
                doc.setTextColor(PDF_CONFIG.colors.text);

                element.items?.forEach((item, index) => {
                    y = checkPageBreak(doc, y, 10);

                    const bullet = element.ordered ? `${index + 1}.` : '•';
                    const itemText = stripMarkdownFormatting(item);

                    doc.text(bullet, PDF_CONFIG.margin, y);

                    const lines = doc.splitTextToSize(
                        itemText,
                        PDF_CONFIG.contentWidth - 10
                    );
                    lines.forEach((line: string, lineIndex: number) => {
                        if (lineIndex > 0) {
                            y += PDF_CONFIG.fontSize.body * PDF_CONFIG.lineHeight.body * 0.352778;
                            y = checkPageBreak(doc, y, 10);
                        }
                        doc.text(line, PDF_CONFIG.margin + 10, y);
                    });

                    y += PDF_CONFIG.fontSize.body * PDF_CONFIG.lineHeight.body * 0.352778 + 2;
                });

                y += PDF_CONFIG.spacing.afterParagraph;
                break;
            }

            case 'code': {
                y = checkPageBreak(doc, y, 30);

                doc.setFontSize(PDF_CONFIG.fontSize.body - 1);
                doc.setFont(PDF_CONFIG.fonts.main, 'normal');
                doc.setFillColor(245, 245, 245);

                const codeLines = element.content.split('\n');
                const codeHeight =
                    codeLines.length * PDF_CONFIG.fontSize.body * 0.352778 * 1.2 + 6;

                // Draw background
                doc.rect(
                    PDF_CONFIG.margin,
                    y - 3,
                    PDF_CONFIG.contentWidth,
                    codeHeight,
                    'F'
                );

                // Draw code text
                doc.setTextColor(PDF_CONFIG.colors.text);
                codeLines.forEach((line) => {
                    doc.text(line, PDF_CONFIG.margin + 3, y);
                    y += PDF_CONFIG.fontSize.body * 0.352778 * 1.2;
                });

                y += PDF_CONFIG.spacing.afterParagraph + 3;
                doc.setFont(PDF_CONFIG.fonts.main, 'normal');
                break;
            }

            case 'image': {
                if (element.url) {
                    y = checkPageBreak(doc, y, 50);
                    y = await embedImage(doc, element.url, PDF_CONFIG.margin, y);
                }
                break;
            }
        }
    }

    return y;
}

/**
 * Adds course content pages
 */
async function addCourseContent(
    doc: jsPDF,
    course: Course
): Promise<void> {
    if (!course.steps || course.steps.length === 0) {
        doc.addPage();
        doc.setFontSize(PDF_CONFIG.fontSize.body);
        doc.setTextColor(PDF_CONFIG.colors.secondary);
        doc.text(
            'No course content available.',
            PDF_CONFIG.margin,
            PDF_CONFIG.margin
        );
        return;
    }

    for (const step of course.steps) {
        doc.addPage();

        let y = PDF_CONFIG.margin;

        // Step title
        doc.setFontSize(PDF_CONFIG.fontSize.h1);
        doc.setFont(PDF_CONFIG.fonts.main, 'bold');
        doc.setTextColor(PDF_CONFIG.colors.primary);

        const titleText = stripMarkdownFormatting(step.title_key);
        const titleLines = doc.splitTextToSize(titleText, PDF_CONFIG.contentWidth);
        titleLines.forEach((line: string) => {
            doc.text(line, PDF_CONFIG.margin, y);
            y += PDF_CONFIG.fontSize.h1 * PDF_CONFIG.lineHeight.heading * 0.352778;
        });

        y += PDF_CONFIG.spacing.afterTitle;

        // Parse and render content
        const elements = parseMarkdown(step.content);
        y = await renderMarkdownElements(doc, elements, y);
    }
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Exports a course as a PDF document
 */
export async function exportCourseAsPdf(course: Course): Promise<void> {
    try {
        console.log('[PDF Export] ========== STARTING PDF EXPORT ==========');
        console.log('[PDF Export] Course title:', course.title);

        // Create PDF document
        const doc = createPdfDocument();

        // Load custom fonts
        await loadFonts(doc);
        doc.setFont(PDF_CONFIG.fonts.main);

        // Add title page
        addTitlePage(doc, course);

        // Add table of contents
        addTableOfContents(doc, course);

        // Add course content
        await addCourseContent(doc, course);

        // Add page numbers to all pages
        addPageNumbers(doc, course.title);

        // Generate filename
        const filename = `${course.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        console.log('[PDF Export] Filename:', filename);

        // Generate PDF as blob with proper MIME type
        const pdfBlob = doc.output('blob');

        console.log('[PDF Export] PDF blob created');
        console.log('[PDF Export] - Size:', pdfBlob.size, 'bytes');
        console.log('[PDF Export] - Type:', pdfBlob.type);

        // Trigger download using standard approach
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);

        console.log('[PDF Export] ========== EXPORT COMPLETED ==========');
    } catch (error) {
        console.error('[PDF Export] ========== EXPORT FAILED ==========');
        console.error('[PDF Export] Error:', error);
        throw new Error('Failed to export course as PDF');
    }
}
