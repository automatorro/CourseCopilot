import PptxGenJS from 'pptxgenjs';
import { SlideDesignJSON } from '../../services/presentationAiService';

// ============================================================================
// TEMPLATE RENDERERS
// ============================================================================

export const renderHeroSlide = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    // Background Image
    if (imageUrl) {
        if (imageUrl.startsWith('data:')) {
             slide.background = { data: imageUrl };
        } else {
             slide.background = { path: imageUrl };
        }
        // Overlay to ensure text readability
        slide.addShape('rect', {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: 50 }
        });
    } else {
        slide.background = { color: data.accentColor || '1E3A8A' };
    }

    // Title Centered
    slide.addText(data.title, {
        x: 0.5, y: 2.5, w: '90%', h: 1.5,
        fontSize: 44, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Arial'
    });

    // Content (Subtitle)
    if (data.content && data.content.length > 0) {
        slide.addText(data.content[0], {
            x: 1, y: 4, w: '80%', h: 1,
            fontSize: 24, color: 'E5E7EB',
            align: 'center', fontFace: 'Arial'
        });
    }
};

export const renderSplitLeft = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    // Image on Left (50%)
    if (imageUrl) {
        if (imageUrl.startsWith('data:')) {
             slide.addImage({ data: imageUrl, x: 0, y: 0, w: '50%', h: '100%' });
        } else {
             slide.addImage({ path: imageUrl, x: 0, y: 0, w: '50%', h: '100%' });
        }
    } else {
        slide.addShape('rect', {
            x: 0, y: 0, w: '50%', h: '100%',
            fill: { color: 'F3F4F6' }
        });
        slide.addText('Image Placeholder', {
            x: 0, y: 2, w: '50%', h: 1,
            align: 'center', color: '9CA3AF'
        });
    }

    // Text on Right
    slide.addText(data.title, {
        x: 5.2, y: 0.5, w: '45%', h: 1,
        fontSize: 32, bold: true, color: '1F2937', fontFace: 'Arial'
    });

    const bullets = data.content.join('\n');
    slide.addText(bullets, {
        x: 5.2, y: 1.8, w: '45%', h: 5,
        fontSize: 18, color: '374151', bullet: true,
        lineSpacing: 28, fontFace: 'Arial'
    });
};

export const renderSplitRight = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    // Text on Left
    slide.addText(data.title, {
        x: 0.5, y: 0.5, w: '45%', h: 1,
        fontSize: 32, bold: true, color: '1F2937', fontFace: 'Arial'
    });

    const bullets = data.content.join('\n');
    slide.addText(bullets, {
        x: 0.5, y: 1.8, w: '45%', h: 5,
        fontSize: 18, color: '374151', bullet: true,
        lineSpacing: 28, fontFace: 'Arial'
    });

    // Image on Right (50%)
    if (imageUrl) {
        if (imageUrl.startsWith('data:')) {
            slide.addImage({ data: imageUrl, x: 5, y: 0, w: '50%', h: '100%' });
        } else {
            slide.addImage({ path: imageUrl, x: 5, y: 0, w: '50%', h: '100%' });
        }
    } else {
        slide.addShape('rect', {
            x: 5, y: 0, w: '50%', h: '100%',
            fill: { color: 'F3F4F6' }
        });
        slide.addText('Image Placeholder', {
            x: 5, y: 2, w: '50%', h: 1,
            align: 'center', color: '9CA3AF'
        });
    }
};

export const renderBigStat = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    // Background
    if (imageUrl) {
        if (imageUrl.startsWith('data:')) {
            slide.background = { data: imageUrl };
        } else {
            slide.background = { path: imageUrl };
        }
        slide.addShape('rect', {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '1E3A8A', transparency: 10 } // Heavy overlay
        });
    } else {
        slide.background = { color: data.accentColor || '1E3A8A' };
    }

    // The Big Number (usually the first item in content or extracted)
    const bigStat = data.content[0] || "100%";
    const description = data.content.slice(1).join('\n') || data.title;

    slide.addText(bigStat, {
        x: 0, y: 1.5, w: '100%', h: 2.5,
        fontSize: 120, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Arial'
    });

    slide.addText(description, {
        x: 1, y: 4.5, w: '80%', h: 1.5,
        fontSize: 24, color: 'E5E7EB',
        align: 'center', fontFace: 'Arial'
    });
};

export const renderComparison = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    slide.addText(data.title, {
        x: 0.5, y: 0.3, w: '90%', h: 0.8,
        fontSize: 28, bold: true, color: '1F2937', align: 'center'
    });

    // Split background
    slide.addShape('rect', { x: 0, y: 1.2, w: '50%', h: '85%', fill: { color: 'F3F4F6' } }); // Left Light
    slide.addShape('rect', { x: 5, y: 1.2, w: '50%', h: '85%', fill: { color: 'E5E7EB' } }); // Right Darker

    // Attempt to split content into two groups
    const half = Math.ceil(data.content.length / 2);
    const leftContent = data.content.slice(0, half).join('\n');
    const rightContent = data.content.slice(half).join('\n');

    slide.addText(leftContent, {
        x: 0.5, y: 1.5, w: '40%', h: 5,
        fontSize: 18, color: '374151', bullet: true
    });

    slide.addText(rightContent, {
        x: 5.5, y: 1.5, w: '40%', h: 5,
        fontSize: 18, color: '374151', bullet: true
    });
};

export const renderQuotation = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    if (imageUrl) {
        if (imageUrl.startsWith('data:')) {
            slide.background = { data: imageUrl };
        } else {
            slide.background = { path: imageUrl };
        }
        slide.addShape('rect', {
            x: 0, y: 0, w: '100%', h: '100%',
            fill: { color: '000000', transparency: 60 }
        });
    } else {
        slide.background = { color: '1F2937' };
    }

    // Big Quote Mark
    slide.addText('“', {
        x: 0.5, y: 0.5, w: 2, h: 2,
        fontSize: 160, color: 'FCD34D', fontFace: 'Georgia'
    });

    slide.addText(data.content[0] || data.title, {
        x: 1.5, y: 2, w: '70%', h: 3,
        fontSize: 32, italic: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Georgia'
    });

    slide.addText(`— ${data.title}`, { // Assuming title is author for quote layout, or generic
        x: 5, y: 5.5, w: '40%', h: 0.5,
        fontSize: 20, color: 'D1D5DB', align: 'right'
    });
};

export const renderTriad = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    slide.addText(data.title, {
        x: 0.5, y: 0.5, w: '90%', h: 0.8,
        fontSize: 28, bold: true, color: '1F2937', align: 'center'
    });

    // 3 Columns
    const colW = 3;
    const gap = 0.3;
    const startX = (10 - (3 * colW) - (2 * gap)) / 2; // Center them

    data.content.slice(0, 3).forEach((item, idx) => {
        const xPos = startX + (idx * (colW + gap));
        
        // Card Background
        slide.addShape('rect', {
            x: xPos, y: 1.5, w: colW, h: 4.5,
            fill: { color: 'FFFFFF' }, line: { color: 'E5E7EB', width: 1 }
        });

        // Content
        slide.addText(item, {
            x: xPos + 0.2, y: 2, w: colW - 0.4, h: 3.5,
            fontSize: 16, color: '374151', align: 'center'
        });
    });
};

export const renderTimeline = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    slide.addText(data.title, {
        x: 0.5, y: 0.5, w: '90%', h: 0.8,
        fontSize: 28, bold: true, color: '1F2937'
    });

    // Draw Line
    slide.addShape('line', {
        x: 1, y: 3.5, w: 8, h: 0,
        line: { color: data.accentColor || '1E3A8A', width: 3 }
    });

    // Points
    const count = Math.min(data.content.length, 5);
    const step = 8 / (count - 1 || 1);

    data.content.slice(0, 5).forEach((item, idx) => {
        const xPos = 1 + (idx * step);
        
        // Dot
        slide.addShape('oval', {
            x: xPos - 0.15, y: 3.35, w: 0.3, h: 0.3,
            fill: { color: data.accentColor || '1E3A8A' }
        });

        // Text (alternate up/down)
        const yText = idx % 2 === 0 ? 2 : 4;
        slide.addText(item, {
            x: xPos - 1, y: yText, w: 2, h: 1.2,
            fontSize: 14, color: '374151', align: 'center'
        });
    });
};

export const renderDefault = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    slide.addText(data.title, {
        x: 0.5, y: 0.5, w: '90%', h: 0.8,
        fontSize: 28, bold: true, color: '1F2937'
    });

    if (imageUrl) {
        slide.addText(data.content.join('\n'), {
            x: 0.5, y: 1.5, w: '50%', h: 5,
            fontSize: 18, color: '374151', bullet: true
        });
        if (imageUrl.startsWith('data:')) {
            slide.addImage({ data: imageUrl, x: 5.8, y: 1.5, w: 4, h: 3 });
        } else {
            slide.addImage({ path: imageUrl, x: 5.8, y: 1.5, w: 4, h: 3 });
        }
    } else {
        slide.addText(data.content.join('\n'), {
            x: 0.5, y: 1.5, w: '90%', h: 5,
            fontSize: 18, color: '374151', bullet: true
        });
    }
};

export const renderImageCenter = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    // Title Top Center
    slide.addText(data.title, {
        x: 0.5, y: 0.3, w: '90%', h: 0.8,
        fontSize: 28, bold: true, color: '1F2937', align: 'center'
    });

    // Large Image Center
    if (imageUrl) {
        if (imageUrl.startsWith('data:')) {
            slide.addImage({ data: imageUrl, x: 1.5, y: 1.3, w: 7, h: 3.5 });
        } else {
            slide.addImage({ path: imageUrl, x: 1.5, y: 1.3, w: 7, h: 3.5 });
        }
    } else {
        slide.addShape('rect', {
            x: 1.5, y: 1.3, w: 7, h: 3.5,
            fill: { color: 'F3F4F6' }
        });
        slide.addText('Image Placeholder', {
            x: 1.5, y: 2.5, w: 7, h: 1,
            align: 'center', color: '9CA3AF'
        });
    }

    // Text Below
    const text = data.content.slice(0, 3).join('\n'); // Limit text
    slide.addText(text, {
        x: 1, y: 5.0, w: 8, h: 2,
        fontSize: 18, color: '374151', align: 'center'
    });
};

export const renderThreeColumns = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    slide.addText(data.title, {
        x: 0.5, y: 0.3, w: '90%', h: 0.8,
        fontSize: 28, bold: true, color: '1F2937'
    });

    const colW = 2.8;
    const gap = 0.4;
    const startX = 0.5;

    // We take up to 3 "chunks" of content. 
    // If content is just a list of bullets, we split them.
    let columns: string[] = [];
    if (data.content.length >= 3) {
        // If we have 3+ bullets, treat each as a column header/content
        columns = data.content.slice(0, 3);
    } else {
        // Duplicate or split? Let's just use what we have
        columns = data.content;
    }

    columns.forEach((item, idx) => {
        if (idx > 2) return;
        const xPos = startX + (idx * (colW + gap));

        // Column Box
        slide.addShape('rect', {
            x: xPos, y: 1.5, w: colW, h: 5,
            fill: { color: 'F9FAFB' }, line: { color: 'E5E7EB', width: 1 }
        });

        // Header Band
        slide.addShape('rect', {
            x: xPos, y: 1.5, w: colW, h: 0.1,
            fill: { color: data.accentColor || '1E3A8A' }
        });

        slide.addText(item, {
            x: xPos + 0.2, y: 1.8, w: colW - 0.4, h: 4.5,
            fontSize: 16, color: '374151', valign: 'top'
        });
    });
};

export const renderFullImage = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    // Background Image covering full slide
    if (imageUrl) {
        if (imageUrl.startsWith('data:')) {
             slide.background = { data: imageUrl };
        } else {
             slide.background = { path: imageUrl };
        }
    } else {
        slide.background = { color: '374151' }; // Dark fallback
    }

    // Heavy overlay for readability
    slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: '000000', transparency: 40 }
    });

    // Content container (centered box)
    slide.addShape('rect', {
        x: 1.5, y: 1.5, w: 7, h: 4.5,
        fill: { color: 'FFFFFF', transparency: 90 }, // Very subtle glass effect
        line: { color: 'FFFFFF', width: 2 }
    });

    slide.addText(data.title, {
        x: 2, y: 2, w: 6, h: 1.5,
        fontSize: 36, bold: true, color: 'FFFFFF',
        align: 'center', fontFace: 'Arial'
    });

    if (data.content.length > 0) {
        const text = data.content.slice(0, 3).join('\n');
        slide.addText(text, {
            x: 2, y: 3.5, w: 6, h: 2,
            fontSize: 20, color: 'F3F4F6',
            align: 'center', fontFace: 'Arial'
        });
    }
};

export const renderGridCards = (slide: PptxGenJS.Slide, data: SlideDesignJSON, imageUrl?: string) => {
    slide.addText(data.title, {
        x: 0.5, y: 0.3, w: '90%', h: 0.8,
        fontSize: 28, bold: true, color: '1F2937'
    });

    // 2x2 Grid
    // 1 2
    // 3 4
    
    const cards = data.content.slice(0, 4);
    const pos = [
        { x: 0.5, y: 1.5 }, { x: 5.2, y: 1.5 },
        { x: 0.5, y: 4.2 }, { x: 5.2, y: 4.2 }
    ];

    cards.forEach((item, idx) => {
        if (idx >= 4) return;
        const p = pos[idx];

        // Card Shape
        slide.addShape('rect', {
            x: p.x, y: p.y, w: 4.3, h: 2.2,
            fill: { color: 'FFFFFF' },
            line: { color: 'E5E7EB', width: 1 },
            shadow: { type: 'outer', color: '000000', opacity: 0.1, blur: 5, offset: 2, angle: 45 }
        });

        // Icon placeholder (Circle)
        slide.addShape('oval', {
            x: p.x + 0.2, y: p.y + 0.2, w: 0.5, h: 0.5,
            fill: { color: data.accentColor || '1E3A8A' }
        });

        // Content
        slide.addText(item, {
            x: p.x + 0.8, y: p.y + 0.2, w: 3.3, h: 1.8,
            fontSize: 16, color: '374151', valign: 'top'
        });
    });
};
