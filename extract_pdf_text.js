import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// We need to import pdfjs-dist dynamically or setup the worker
// In Node.js, pdfjs-dist usage can be a bit tricky with workers.
// We'll try a standard approach for Node environment.

import * as pdfjsLib from 'pdfjs-dist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.join(__dirname, 'course-examples', 'manual trainer Vanzari.pdf');

async function extractText() {
    console.log(`Reading PDF from: ${pdfPath}`);

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = new Uint8Array(dataBuffer);

        // Point to the standard font path for Node
        // pdfjsLib.GlobalWorkerOptions.workerSrc = '...'; // Not always needed in Node if we don't use worker

        const loadingTask = pdfjsLib.getDocument({
            data: data,
            // Disable worker for simpler Node execution if possible, or let it fallback
            disableFontFace: true,
        });

        const pdfDocument = await loadingTask.promise;
        console.log(`PDF loaded. Pages: ${pdfDocument.numPages}`);

        let fullText = '';
        // Read first 10 pages to get the idea (or all if small)
        const maxPages = Math.min(pdfDocument.numPages, 15);

        for (let i = 1; i <= maxPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');

            fullText += `\n--- PAGE ${i} ---\n${pageText}\n`;
        }

        console.log(fullText);

    } catch (error) {
        console.error("Error extracting text:", error);
    }
}

extractText();
