PDF Export Implementation Plan
Overview
This plan outlines the implementation of PDF export functionality for the CourseCopilot application. The feature will allow users to download their course content as a professionally formatted PDF document, complementing the existing PPTX and ZIP export options.

Background Context
The application currently supports:

PPTX Export: Generates PowerPoint presentations with slides and speaker notes
ZIP Export: Packages course materials as DOCX files in a ZIP archive
Export Modal: Unified UI for selecting export formats
The PDF export will leverage the existing export architecture and data models while providing a document-oriented view of course content.

Proposed Changes
Phase 1: Dependencies & Setup
[NEW] Package Dependencies
Install required libraries:

npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf
Libraries chosen:

jspdf: Industry-standard PDF generation library with extensive features
jspdf-autotable: Plugin for creating formatted tables in PDFs
Phase 2: Core PDF Service
[NEW] 
pdfExporter.ts
New service module for PDF generation with the following functions:

Core Functions:

exportCourseAsPdf(course: Course): Promise<void> - Main export function
createPdfDocument(): jsPDF - Initialize PDF with settings
addTitlePage(doc: jsPDF, course: Course): void - Generate cover page
addTableOfContents(doc: jsPDF, course: Course): void - Generate TOC
addCourseContent(doc: jsPDF, steps: CourseStep[]): void - Render course steps
addPageNumbers(doc: jsPDF): void - Add headers/footers
Helper Functions:

parseMarkdownToPdf(doc: jsPDF, markdown: string, yPos: number): number - Convert markdown to PDF text
addFormattedText(doc: jsPDF, text: string, options: TextOptions): void - Add styled text
embedImage(doc: jsPDF, imageUrl: string, x: number, y: number): Promise<void> - Add images
checkPageBreak(doc: jsPDF, currentY: number, requiredSpace: number): number - Handle pagination
Styling Configuration:

const PDF_CONFIG = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 20,
  fontSize: {
    title: 24,
    h1: 18,
    h2: 14,
    h3: 12,
    body: 10,
  },
  lineHeight: 1.5,
  colors: {
    primary: '#2563eb',
    text: '#1f2937',
    secondary: '#6b7280',
  }
};
Phase 3: Service Integration
[MODIFY] 
exportService.ts
Add PDF export function alongside existing exporters:

// Add import
import { exportCourseAsPdf } from './pdfExporter';
// Add to existing export functions (around line 370)
export async function exportCourseAsPdf(course: Course): Promise<void> {
  return pdfExporter.exportCourseAsPdf(course);
}
Phase 4: UI Integration
[MODIFY] 
ExportModal.tsx
Changes:

Enable PDF export button (currently disabled)
Update subtitle from "coming soon" to active state
Wire up onExport('pdf') handler
Specific edits:

Line 85: Remove disabled={isExporting} or update to match PPTX logic
Line 92: Update subtitle to "Download course manual as PDF"
Phase 5: Parent Component Updates
[MODIFY] Component using ExportModal
Update the parent component that handles export logic to support PDF format:

const handleExport = async (format: 'pptx' | 'pdf' | 'zip') => {
  setIsExporting(true);
  try {
    if (format === 'pptx') {
      await exportCourseAsPptx(course);
    } else if (format === 'pdf') {
      await exportCourseAsPdf(course); // New handler
    } else if (format === 'zip') {
      await exportCourseAsZip(course);
    }
  } catch (error) {
    console.error('Export failed:', error);
    // Show error toast
  } finally {
    setIsExporting(false);
  }
};
Technical Architecture
PDF Document Structure
1. Title Page
   - Course Title
   - Description
   - Generation Date
   - Logo/Branding
2. Table of Contents
   - Module listings
   - Page numbers
   - Hyperlinks (if supported)
3. Course Content
   For each CourseStep:
   - Step title (H1)
   - Step content (parsed markdown)
   - Images (embedded)
   - Page breaks between major sections
4. Footer
   - Page numbers
   - Course title
   - Generation timestamp
Markdown Parsing Strategy
The PDF exporter will parse markdown content and convert it to PDF elements:

Headings: #, ##, ### → Different font sizes
Bold: **text** → Bold font
Italic: *text* → Italic font
Lists: - item or 1. item → Bullet/numbered lists
Code: `code` → Monospace font with background
Images: ![alt](url) → Embedded images
Links: [text](url) → Underlined text with URL in parentheses
Image Handling
Images will be:

Fetched as data URLs (similar to PPTX export)
Embedded in the PDF at appropriate positions
Scaled to fit within page margins
Positioned with proper spacing
Verification Plan
Automated Tests
Unit Tests (to be added later):

describe('pdfExporter', () => {
  it('should create a PDF document', () => {});
  it('should parse markdown headings correctly', () => {});
  it('should handle images', () => {});
  it('should paginate long content', () => {});
});
Integration Tests:

Test full export flow from UI to file download
Verify PDF file is generated and downloadable
Check file size is reasonable
Manual Verification
Basic Export Test:

Create a simple course with text content
Export as PDF
Verify PDF opens correctly
Check title page, TOC, and content
Complex Content Test:

Create course with:
Multiple modules
Rich markdown (headings, lists, bold, italic)
Images
Long content requiring pagination
Export and verify all elements render correctly
Cross-Browser Test:

Test export in Chrome, Firefox, Safari, Edge
Verify download works in all browsers
Check PDF compatibility
Performance Test:

Export large course (10+ modules, 50+ steps)
Measure export time
Check PDF file size
Verify no browser crashes or freezes
Success Criteria
✅ PDF export button is functional in ExportModal
✅ PDF file downloads with course title as filename
✅ PDF contains title page, TOC, and all course content
✅ Markdown is correctly parsed and formatted
✅ Images are embedded and displayed
✅ Page numbers and headers/footers are present
✅ Export completes in < 10 seconds for typical course
✅ PDF file size is reasonable (< 10MB for typical course)
✅ PDF opens in standard PDF readers (Adobe, Chrome, etc.)
Implementation Phases
Phase 1: Foundation (Steps 1-3)
Install dependencies
Create basic PDF exporter service
Implement title page and TOC
Phase 2: Content Rendering (Steps 4-6)
Implement markdown parser
Add text formatting
Handle pagination
Phase 3: Advanced Features (Steps 7-9)
Add image support
Implement headers/footers
Add styling and polish
Phase 4: Integration (Steps 10-12)
Wire up to exportService
Update ExportModal UI
Connect to parent component
Phase 5: Testing & Refinement (Steps 13-15)
Manual testing with various courses
Bug fixes and optimizations
Documentation updates
Risk Mitigation
Risk	Mitigation
Large images cause PDF bloat	Implement image compression/resizing
Complex markdown parsing errors	Use robust regex patterns, fallback to plain text
Browser memory issues with large PDFs	Implement streaming/chunking if needed
Cross-browser compatibility	Test early and often across browsers
Slow export performance	Add progress indicators, optimize rendering
Future Enhancements
Post-MVP features to consider:

Custom PDF styling/themes
Interactive table of contents with hyperlinks
Embedded videos (as QR codes or links)
Multi-language support
PDF/A compliance for archival
Watermarks or branding options