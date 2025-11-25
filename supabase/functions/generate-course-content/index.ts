// @ts-nocheck
// ABOUTME: This Supabase Edge Function now handles both generating AND improving course content.
// ABOUTME: It uses the Google Gemini API and selects the correct prompt based on the requested action.
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const STEP_TITLES: { [key: string]: string } = {
    'course.steps.structure': "Structure & Agenda",
    'course.steps.slides': "Slides Content",
    'course.steps.exercises': "Practical Exercises",
    'course.steps.manual': "Trainer/Student Manual",
    'course.steps.tests': "Final Test/Assessment",
    // New Steps for Online Course
    'course.steps.video_scripts': "Video Scripts",
    'course.steps.projects': "Practical Projects",
    'course.steps.cheat_sheets': "Cheat Sheets / Summary Cards"
};

// Main server function
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { course, step, action, originalContent } = await req.json();

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) {
            throw new Error("GEMINI_API_KEY is not set in Supabase secrets.");
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const stepTitle = STEP_TITLES[step.title_key] || "Unknown Step";
        let prompt;

        // --- PROMPT ROUTER ---
        if (action === 'improve') {
            // --- IMPROVEMENT PROMPT (Generic for now, can be specialized later) ---
            prompt = `
          **ROLE:** You are a senior instructional design editor.
          **CONTEXT:** Improving a section of a ${course.environment} course titled "${course.title}".
          **CURRENT STEP:** ${stepTitle}
          **LANGUAGE:** ${course.language}

          **ORIGINAL TEXT:**
          ---
          ${originalContent}
          ---

          **TASK:** Rewrite the text to be more engaging, clear, and pedagogically sound.
          **RULES:** Keep the same format (Markdown). Output ONLY the improved text.
        `;
        } else {
            // --- GENERATION PROMPT ---

            // 1. Build Context from Previous Steps
            const previousStepsContext = course.steps
                ?.filter((s: any) => s.step_order < step.step_order && s.content)
                .map((s: any) => `--- PREVIOUS STEP: ${STEP_TITLES[s.title_key]} ---\n${s.content.substring(0, 500)}...\n`) // Truncate for token limit
                .join('\n');

            // 2. Define Pedagogical Guidance based on Environment
            let pedagogicalGuidance = "";
            if (course.environment === 'LiveWorkshop') {
                pedagogicalGuidance = `
          **PEDAGOGY (Live Workshop):**
          - Focus on **interaction**: Ask questions to the audience, suggest group activities.
          - Content is for **slides and speaking notes**. Keep it punchy.
          - Use **Merrill's First Principles of Instruction**: Activation, Demonstration, Application, Integration.
        `;
            } else if (course.environment === 'OnlineCourse') {
                pedagogicalGuidance = `
          **PEDAGOGY (Online Video Course):**
          - Focus on **visual storytelling** and clear, scripted narration.
          - Content is for **video scripts** and **downloadable assets**.
          - Use **Mayer's Principles of Multimedia Learning**: Weed out extraneous words (Coherence Principle).
        `;
            } else {
                // Fallback for Corporate/Academic
                pedagogicalGuidance = `**PEDAGOGY:** Focus on clear learning objectives and structured content.`;
            }

            // 3. Define Specific Instructions based on Step Type
            let specificInstructions = "";
            switch (step.title_key) {
                case 'course.steps.structure':
                    specificInstructions = `
            - Create a **Detailed Course Outline** structured by Modules and Lessons.
            - **CRITICAL**: For EVERY Lesson, you MUST define 2-3 specific **Learning Objectives** using Bloom's Taxonomy verbs (e.g., Define, Analyze, Create).
            - Format:
              ### Module 1: [Title] (Total Time)
              #### Lesson 1.1: [Title] ([Time] min)
              *   **Objectives**:
                  *   By the end of this lesson, participants will be able to...
              *   **Key Topics**: [List of topics]
            - Ensure the flow is logical and builds complexity gradually.
          `;
                    break;
                case 'course.steps.video_scripts':
                    specificInstructions = `
            - Write a **Video Script** for the key lessons defined in the structure.
            - Format: **[VISUAL]** (what is on screen) vs **[AUDIO]** (what the speaker says).
            - Include a "Hook" at the start and a "Call to Action" at the end of each script.
            - Keep sentences short and conversational.
          `;
                    break;
                case 'course.steps.slides':
                    specificInstructions = `
            - Create content for **Presentation Slides**.
            - Format: **Slide Title**, **Bullet Points** (max 5), **Speaker Notes**.
            - Suggest an image description for each slide.
          `;
                    break;
                case 'course.steps.cheat_sheets':
                    specificInstructions = `
            - Create a **Cheat Sheet / One-Pager** summary.
            - Use tables, checklists, and bold key terms.
            - Focus on "Quick Wins" and actionable tips.
          `;
                    break;
                case 'course.steps.exercises':
                case 'course.steps.projects':
                    specificInstructions = `
            - Design a practical **${course.environment === 'LiveWorkshop' ? 'Group Activity' : 'Individual Project'}**.
            - Include: Objective, Instructions, Materials Needed, and Success Criteria.
            - Suggest a "Solution" or "Answer Key" if applicable.
          `;
                    break;
                case 'course.steps.manual':
                    if (course.environment === 'LiveWorkshop') {
                        specificInstructions = `
            - Create a **Trainer's Manual** (Facilitator Guide) in a structured table format.
            - Use a Markdown table with these columns: **Slide/Topic**, **Time**, **Activity Type** (Presentation, Discussion, Exercise, Break), **Facilitator Instructions & Script**.
            - **Facilitator Instructions**: Include exactly what to say (script) and what to do (actions).
            - Include specific instructions for exercises (group split, materials needed).
            - Example row: | Slide 1: Intro | 5 min | Presentation | Say: "Welcome..." |
          `;
                    } else {
                        specificInstructions = `
            - Create a comprehensive **Student Manual / Guide**.
            - Include detailed explanations of the concepts covered in the course.
            - Use clear headings, bullet points, and examples.
          `;
                    }
                    break;
                case 'course.steps.tests':
                    specificInstructions = `
            - Create a **Final Assessment**.
            - Include 5-10 Multiple Choice Questions with correct answers and explanations.
          `;
                    break;
                default:
                    specificInstructions = `- Generate comprehensive content for this section.`;
            }

            // 4. Assemble the Final Prompt
            prompt = `
          **ROLE:** You are an expert instructional designer specializing in ${course.environment}.

          **COURSE CONTEXT:**
          *   Title: ${course.title}
          *   Subject: ${course.subject}
          *   Target Audience: ${course.target_audience}
          *   Language: ${course.language}

          ${pedagogicalGuidance}

          **PREVIOUS CONTEXT:**
          ${previousStepsContext || "Start of course."}

          **YOUR TASK:**
          Generate content for the step: **"${stepTitle}"**.

          **SPECIFIC INSTRUCTIONS:**
          ${specificInstructions}

          **OUTPUT RULES:**
          1.  **Language:** STRICTLY output in **${course.language}**.
          2.  **Format:** Use clean Markdown. Use bolding for emphasis.
          3.  **Tone:** Professional, encouraging, and adapted to the environment.
          4.  **No Fluff:** Go straight to the content. No "Here is the content" intros.
        `;
        }

        // Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ content: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error("Error in Edge Function:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
