This is a comprehensive and detailed implementation plan for the CourseCopilot Presentation Engine (PPTX Export with AI Layouts & Unsplash Integration).

This plan transforms the current linear export system into an intelligent "Instructional Designer" that parses content, decides on the best visual layout, and populates it with high-quality images from Unsplash.

Phase 1: Infrastructure & Security (Supabase)
We need to secure your API keys and prepare the backend to handle AI analysis and image searching without exposing credentials to the client.

Task 1.1: Environment Configuration
Action: You will add the Unsplash credentials to your environment variables.
Where: .env (local) and Supabase Secrets (production).
Variables:
UNSPLASH_ACCESS_KEY=ifFld...
UNSPLASH_SECRET_KEY=E3oMn...
Task 1.2: Create unsplash-search Edge Function
Goal: Create a secure proxy for the Unsplash API.
Implementation: A new Supabase Edge Function that receives a search query, adds the secret key headers, calls Unsplash, and returns the results. This prevents your Secret Key from leaking in the frontend code.
Task 1.3: Create analyze-slide Edge Function (or update existing)
Goal: An endpoint that takes raw Markdown text for a slide and returns a structured JSON object describing the design (Layout Type, Refined Text, Image Prompt).
Logic: Uses the "Instructional Designer" System Prompt defined in the documentation.
Phase 2: The "Brain" (Frontend AI Service)
We will create a service that acts as the bridge between the raw course content and the visual export.

Task 2.1: Create src/services/presentationAiService.ts
Function: analyzeSlideContent(content: string): Promise<SlideDesignJSON>
Description: This function calls the analyze-slide Edge Function. It handles the "thinking" part—deciding if a slide should be a "Big Stat", a "Comparison", or a "Hero Slide".
Output Interface:
TypeScript



interface SlideDesignJSON {  layout: 'HERO' |   'SPLIT_LEFT' |   'SPLIT_RIGHT' | 'BIG_STAT' |   'COMPARISON' | 'QUOTATION' |   'TRIAD' | 'TIMELINE';  title: string;  content: string[]; //   Optimized bullet points  imagePrompt: string; // For   Unsplash search  accentColor?: string;}
Phase 3: The "Painter" (PPTX Template Engine)
We will replace the generic "addText" calls with a robust template system.

Task 3.1: Create src/lib/pptx/templates.ts
Goal: Implement the 8 specific layouts requested.
Functions:
renderHeroSlide(slide, data): Full-screen background image with overlay text.
renderSplitScreen(slide, data): 50% image / 50% text.
renderBigStat(slide, data): Massive font for numbers, minimal text.
renderQuotation(slide, data): Centered, italicized text with visual quote marks.
renderTriad(slide, data): 3 columns for lists/processes.
renderComparison(slide, data): Two contrasting columns (e.g., Pros/Cons).
renderVisualAnchor(slide, data): Minimal text anchored by a strong visual.
renderTimeline(slide, data): Horizontal or vertical process flow.
Phase 4: Integration & Workflow (Export Service)
This is where we connect everything together in src/services/exportService.ts.

Task 4.1: Update exportCourseAsPptx Workflow
Current Flow: Parse Markdown -> Add generic text/bullets -> Save.
New Flow:
Parse: Split Markdown into slide chunks.
Analyze (Async): For each chunk, call presentationAiService to get the layout JSON.
Fetch Assets (Async): If the layout requires an image, call searchUnsplash(data.imagePrompt) via the new Edge Function.
Render: Pass the data + image URL to the appropriate render[Layout] function from Task 3.1.
Save: Generate the .pptx file.
Task 4.2: Error Handling (Fail Gracefully)
If Unsplash fails or returns no results -> Use a solid color or gradient background (as per your request).
If AI Analysis fails -> Fallback to the standard "Title + Bullets" layout.
Phase 5: User Interface Updates
Task 5.1: Progress Feedback
Since AI analysis + Unsplash search takes time, we need to update the progress bar in the Export Modal to show specific steps (e.g., "Designing Slide 3/10...", "Searching for images...").
Action Plan for YOU (The User)
Before I begin coding, please perform the following:

Create/Update .env file in the project root:

env



UNSPLASH_ACCESS_KEY=ifFldpcj-ewVcL8nNQwsHrWOhd5v0Qx6PPGLM_t46qsUNSPLASH_SECRET_KEY=E3oMnONyzbG-R3xFDVI6PQEfw-9mLS7Miu90fvJxQJQ
(Note: I will use these in the Supabase Edge Function, but it's good practice to have them locally for development)