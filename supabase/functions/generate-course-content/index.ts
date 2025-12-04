import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
  'course.steps.video_scripts': "Video Scripts",
  'course.steps.projects': "Practical Projects",
  'course.steps.cheat_sheets': "Cheat Sheets / Summary Cards"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      course,
      step,
      action,
      originalContent,
      messages,
      chat_history,
      refinePayload,
      context_files,
      fileContent,
      fileName,
      environment,
      blueprint,
      existingContent,
      step_type,
      previous_steps
    } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in Supabase secrets.");
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const stepTitle = step ? (STEP_TITLES[step.title_key] || "Unknown Step") : "General";
    let prompt;
    let isJsonMode = false;

    let fileContext = "";
    if (context_files && context_files.length > 0) {
      const { data: files, error } = await supabase
        .from('course_files')
        .select('filename, extracted_text')
        .in('id', context_files);

      if (!error && files) {
      }

    }


    if (action === 'ping') {
      return new Response(JSON.stringify({ message: 'pong' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (action === 'analyze_upload') {
      isJsonMode = true;
      prompt = `
        **ROLE:** You are an expert Instructional Designer.
        **TASK:** Analyze the provided course content and structure it into a formal Course Blueprint.
        
        **INPUT CONTENT:**
        ---
        Filename: ${fileName}
        Content: ${fileContent ? fileContent.substring(0, 50000) : ''}... (truncated if too long)
        ---
        
        **TARGET ENVIRONMENT:** ${environment}
        
        **INSTRUCTIONS:**
        1. Extract the main topic and target audience.
        2. Break down the content into logical Modules and Sections.
        3. Assign appropriate 'content_type' to each section based on the content (e.g., 'slides' for theory, 'exercise' for practice).
        4. Generate a learning objective for each module.
        
        **OUTPUT FORMAT (JSON):**
        {
          "version": "1.0",
          "title": "Course Title",
          "target_audience": "Audience description",
          "estimated_duration": "e.g. 2 hours",
          "generated_at": "${new Date().toISOString()}",
          "modules": [
            {
              "id": "module-1",
              "title": "Module 1 Title",
              "learning_objective": "Objective",
              "sections": [
                {
                  "id": "section-1-1",
                  "title": "Section Title",
                  "content_type": "slides",
                  "order": 1,
                  "content_outline": "Summary of content"
                }
              ]
            }
          ]
        }
      `;
    } else if (action === 'fill_gaps') {
      isJsonMode = true;
      prompt = `
        **ROLE:** You are an expert Instructional Designer.
        **TASK:** Identify missing pedagogical elements in the course content and generate them.
        
        **COURSE BLUEPRINT:**
        ${JSON.stringify(blueprint)}
        
        **EXISTING CONTENT:**
        ${existingContent ? existingContent.substring(0, 20000) : ''}...
        
        **INSTRUCTIONS:**
        1. Based on the blueprint and content, identify what is missing (e.g., quizzes, practical exercises, summaries).
        2. Generate the missing content.
        
        **OUTPUT FORMAT (JSON):**
        {
          "gaps": [
            {
              "type": "quiz",
              "module_id": "module-1",
              "content": "Question 1: ..."
            }
          ]
        }
      `;
    } else if (action === 'generate_learning_objectives') {
      isJsonMode = true;
      prompt = `
**ROLE:** You are a pedagogical expert specializing in learning objective design using Bloom's Taxonomy.

**TASK:** Generate 3-5 clear, measurable, actionable learning objectives for this course.

**COURSE CONTEXT:**
- Title: ${course.title}
- Subject: ${course.subject}
- Target Audience: ${course.target_audience}
- Environment: ${course.environment}
- Language: ${course.language}

${fileContext ? `**REFERENCE MATERIALS:**\nUse these materials to inform the objectives:\n${fileContext}\n` : ''}

**INSTRUCTIONS:**
1. Use Bloom's Taxonomy verbs (e.g., Analyze, Create, Evaluate, Apply, Understand, Remember)
2. Make objectives SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
3. Focus on what participants will BE ABLE TO DO (not just "know")
4. Match the complexity to the target audience
5. Consider the environment:
6.    - LiveWorkshop: Include practical application objectives
7.    - OnlineCourse: Include self-paced learning objectives

**OUTPUT FORMAT (JSON):**
You must output ONLY a valid JSON object with NO markdown code blocks.

{
  "objectives": [
    "By the end of this course, participants will be able to [verb] [specific skill/knowledge]",
    "Participants will be able to [verb] [specific skill/knowledge]",
    ...
  ]
}

**EXAMPLE:**
For a React course:
{
  "objectives": [
    "Build a functional React application using components and hooks",
    "Implement state management using Context API and reducers",
    "Debug React applications using React Developer Tools"
  ]
}
`;
    } else if (action === 'chat_onboarding') {
      isJsonMode = true;
      const conversationHistory = messages || chat_history || [];
      const history = conversationHistory.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

      prompt = `
          **SYSTEM**: You are an expert Instructional Designer and Curriculum Architect.
          **GOAL**: Conduct an intake interview with the user to design a high-quality course blueprint.
          
          **CONTEXT**:
          - Provisional Title: ${course.title}
          - Subject: ${course.subject}
          - Environment: ${course.environment} (Live Workshop vs Online Course)
          - Language: ${course.language}

          ${fileContext ? `**REFERENCE MATERIALS:**\nThe user has provided these materials:\n${fileContext}\n` : ''}

          **CHAT HISTORY**:
          ${history}

          **INSTRUCTIONS:**
          1.  **Analyze** the conversation so far.
          2.  **Determine** if you have enough information to create a comprehensive Course Blueprint. Key info needed:
              - Specific Learning Objectives (what will they be able to do?)
              - Target Audience details (beginner, advanced, corporate, etc.)
              - Depth/Tone preference (beginner-friendly, advanced, practical, theoretical)
          3.  **Auto-Calculate Duration** based on topic complexity:
              - Simple topic (1-2 key concepts): "2-3 hours"
              - Moderate topic (3-5 key concepts): "4-5 hours"
              - Complex topic (6+ key concepts): "6-8 hours"
              - NEVER exceed "8 hours" (hard limit for quality and cost control)
          4.  **Interact**:
              - If info is missing: Ask ONE clear, relevant follow-up question to gather it. Do not ask multiple questions at once.
              - If info is sufficient: Generate the Course Blueprint.

          **OUTPUT FORMAT**:
          You must output a VALID JSON object. Do not use Markdown code blocks.
          
          Structure:
          {
            "message": "Text response to the user (question or confirmation)",
            "blueprint": null | {
               "version": "1.0",
               "title": "Refined Course Title",
               "target_audience": "Detailed audience description",
               "estimated_duration": "Estimated duration (e.g., '2 hours', '3 days')",
               "generated_at": "[ISO timestamp]",
               "modules": [
                 {
                   "id": "module-1",
                   "title": "Module 1: Name",
                   "learning_objective": "What participants will achieve in this module",
                   "sections": [
                      { 
                        "id": "section-1-1",
                        "title": "Section 1.1: Name", 
                        "content_type": "slides",
                        "order": 1,
                        "content_outline": "Brief description of what will be covered"
                      },
                      { 
                        "id": "section-1-2",
                        "title": "Section 1.2: Quiz", 
                        "content_type": "quiz",
                        "order": 2,
                        "content_outline": "Assessment of module concepts"
                      }
                   ]
                 }
               ]
            }
          }
          
          **BLUEPRINT RULES**:
          - "content_type" must be one of: 'slides', 'video_script', 'exercise', 'reading', 'quiz'.
          - Create a logical flow that builds complexity gradually.
          - **For LiveWorkshop environment**: Emphasize 'slides' (presentation content) and 'exercise' (group activities).
          - **For OnlineCourse environment**: Emphasize 'video_script' (video narration) and 'reading' (self-paced materials).
          - Include at least one 'quiz' or 'exercise' per module for knowledge check.
          - Each module should have a clear learning_objective.
          - Generate unique IDs for modules and sections (e.g., "module-1", "section-1-1").
        `;
    } else if (action === 'improve') {
      // --- IMPROVEMENT PROMPT ---
      prompt = `
          **ROLE:** You are a senior instructional design editor.
          **CONTEXT:** Improving a section of a ${course.environment} course titled "${course.title}".
          **CURRENT STEP:** ${stepTitle}
          **LANGUAGE:** ${course.language}

          ${fileContext ? `**REFERENCE MATERIALS:**\nUse these materials to ensure accuracy and relevance:\n${fileContext}\n` : ''}

          **ORIGINAL TEXT:**
          ---
          ${originalContent}
          ---

          **TASK:** Rewrite the text to be more engaging, clear, and pedagogically sound.
          **RULES:** Keep the same format (Markdown). Output ONLY the improved text.
        `;
    } else if (action === 'refine') {
      // --- REFINE SELECTION PROMPT ---
      const { selectedText, actionType } = refinePayload || {};


      prompt = `
          **ROLE:** You are a senior instructional design editor.
          **CONTEXT:** Refining a specific section of a ${course.environment} course titled "${course.title}".
          **LANGUAGE:** ${course.language}

          ${fileContext ? `**REFERENCE MATERIALS:**\nUse these materials if relevant to the refinement:\n${fileContext}\n` : ''}

          **SELECTED TEXT:**
          "${selectedText}"

          **INSTRUCTION:** ${actionType}

          **TASK:** Rewrite the SELECTED TEXT to follow the INSTRUCTION.
          **RULES:** 
          1. Output ONLY the rewritten text. 
          2. Do NOT include the instruction or any conversational filler.
          3. Maintain the same Markdown formatting (bold, italics, etc.) unless the instruction implies changing it.
          4. Ensure the tone fits the course environment (${course.environment}).
      `;

    } else if (action === 'generate_step_content') {
      // --- NEW: 12-STEP TRAINER FLOW GENERATION ---
      // --- NEW: 12-STEP TRAINER FLOW GENERATION ---
      // const { step_type, previous_steps } = await req.json(); // REMOVED: Already parsed above

      // Build context from previous steps (critical for continuity)
      const previousContext = previous_steps
        ? previous_steps.map((s: any) => `\n--- PREVIOUS STEP: ${s.step_type} ---\n${s.content.substring(0, 2000)}`).join('\n')
        : "";

      // Extract blueprint duration for enforcement
      const blueprintDuration = course.blueprint?.estimated_duration || "4 hours";
      const durationEnforcement = `
**CRITICAL CONSTRAINT - TOTAL COURSE DURATION**: ${blueprintDuration}
- The ENTIRE course must fit within ${blueprintDuration}. DO NOT EXCEED THIS LIMIT.
- Allocate time proportionally across all modules.
- If generating detailed content, ensure it's appropriate for this duration.
`;

      let specificPrompt = "";

      switch (step_type) {
        case 'performance_objectives':
          specificPrompt = `
            **TASK**: Generate Performance Objectives.
            **GOAL**: Define exactly what participants will be able to DO by the end.
            **INSTRUCTIONS**:
            - Use Bloom's Taxonomy (Action Verbs).
            - Focus on observable behaviors.
            - 6–8 items maximum, in the specified **LANGUAGE**.
            - Headings and labels must be in the specified **LANGUAGE** (no English words like "High-Level", "Welcome").
            - Format as a bulleted list.
          `;
          break;
        case 'course_objectives':
          specificPrompt = `
            **TASK**: Generate Course Objectives (strategic).
            **GOAL**: Define the broader goals and business impact.
            **INSTRUCTIONS**:
            - Connect learning to business/personal outcomes.
            - Keep it inspiring but realistic.
            - Write all headings and content strictly in the specified **LANGUAGE**.
            - Do not use English phrases or mixed-language headings.
          `;
          break;
        case 'structure':
          specificPrompt = `
            **TASK**: Design the Course Structure (Architecture).
            **GOAL**: Outline the Modules and Lessons.
            **INSTRUCTIONS**:
            - Create a logical flow (Simple to Complex).
            - Define time allocation for each module that TOTALS to ${blueprintDuration}.
            - Format as a hierarchical outline.
            - All module titles and section titles must be in the specified **LANGUAGE**.
            - Do not introduce English headings or labels.
            - CRITICAL: Ensure all modules combined equal ${blueprintDuration}, not more.
          `;
          break;
        case 'learning_methods':
          specificPrompt = `
            **TASK**: Select Learning Methods.
            **GOAL**: Choose the best pedagogical approach for each module.
            **INSTRUCTIONS**:
            - Suggest methods like: Lecture, Case Study, Role Play, Simulation, Discussion.
            - Justify WHY this method fits the content.
            - Map methods to specific modules from the structure.
          `;
          break;
        case 'timing_and_flow':
          specificPrompt = `
            **TASK**: Design Timing and Flow.
            **GOAL**: Create a detailed minute-by-minute agenda.
            **INSTRUCTIONS**:
            - Break down each module into specific activities.
            - Include breaks and energy checks.
            - Ensure the total time matches ${blueprintDuration} EXACTLY.
          `;
          break;
        case 'exercises':
          specificPrompt = `
            **TASK**: Design Practical Exercises (Deep Content).
            **GOAL**: Create detailed instructions for all hands-on activities.
            **INSTRUCTIONS**:
            - **QUANTITY**: Generate at least **2-3 distinct exercises per module**.
            - For each exercise, define:
              1. **Purpose**: Why are we doing this?
              2. **Instructions**: Step-by-step guide for participants.
              3. **Materials**: What is needed?
              4. **Debrief**: Questions for the facilitator to ask afterwards.
          `;
          break;
        case 'examples_and_stories':
          specificPrompt = `
            **TASK**: Generate Examples, Stories, and Case Studies.
            **GOAL**: Make the theory concrete and relatable.
            **INSTRUCTIONS**:
            - **QUANTITY**: Provide at least **3 concrete examples or analogies** per module.
            - Provide 1-2 relevant examples or analogies for each major concept.
            - Create a "Hero's Journey" style story if appropriate.
            - Ensure examples fit the Target Audience industry/context.
            - For each example, write 3–5 sentences: setup, challenge, resolution, and a takeaway.
            - Use the specified **LANGUAGE** for titles and content, with no mixed-language output.
          `;
          break;
        case 'facilitator_notes':
          specificPrompt = `
            **TASK**: Write Facilitator Notes (Deep Content).
            **GOAL**: Guide the trainer on HOW to deliver the content.
            **INSTRUCTIONS**:
            - Include "Say" (Script snippets) and "Do" (Actions).
            - Highlight potential pitfalls or difficult questions.
            - Provide tips for managing energy and engagement.
          `;
          break;
        case 'slides':
          specificPrompt = `
            **TASK**: Generate Slide Content.
            **GOAL**: Create the visual support structure.
            **INSTRUCTIONS**:
            - **QUANTITY**: Generate content for at least **5-7 slides per module**.
            - Based on the Structure and Deep Content.
            - Format: **Slide Title**, **Bullet Points** (max 5), **Image Suggestion**.
            - STRICTLY NO WALLS OF TEXT.
          `;
          break;
        case 'facilitator_manual':
          specificPrompt = `
            **TASK**: Compile the Facilitator Manual.
            **GOAL**: A complete guide for the trainer.
            **INSTRUCTIONS**:
            - Combine Structure, Timing, Notes, and Exercises into a cohesive document.
            - Use a clear, readable format (e.g., tables for agenda).
            - Keep headings and labels strictly in the specified **LANGUAGE**.
          `;
          break;
        case 'participant_workbook':
          specificPrompt = `
            **TASK**: Create the Participant Workbook.
            **GOAL**: Materials for the student to use during the course.
            **INSTRUCTIONS**:
            - Include: Key Concepts (summarized), Exercise worksheets (blank spaces), Reflection questions.
            - Do NOT include the full agenda; reference sections can say "see Agenda" without copying it.
            - Keep language consistent (titles and content in the specified **LANGUAGE**).
            - Do not introduce new modules not present in the Structure. If adding a "Plan de acțiune personalizat" template, place it as a closing section (not numbered as a new module).
            - Tone: Encouraging and learner-centric.
          `;
          break;
        case 'video_scripts':
          specificPrompt = `
            **TASK**: Write Video Scripts (for Online Course).
            **GOAL**: Engaging scripts for video production.
            **INSTRUCTIONS**:
            - **QUANTITY**: Write a script for **every key lesson** defined in the structure.
            - Format: **[VISUAL]** vs **[AUDIO]**.
            - Keep sentences short and spoken-word style.
            - Include "Hook", "Content", and "Call to Action".
          `;
          break;
        default:
          specificPrompt = `**TASK**: Generate content for ${step_type}.`;
      }

      prompt = `
        **ROLE**: You are a World-Class Instructional Designer and Curriculum Architect.
        **CONTEXT**: Creating a **${course.environment}** course titled "**${course.title}**".
        **TARGET AUDIENCE**: ${course.target_audience}
        **LANGUAGE**: ${course.language}

        ${durationEnforcement}

        ${fileContext ? `**REFERENCE MATERIALS**:\n${fileContext}\n` : ''}

        ${previousContext}

        ${specificPrompt}

        **OUTPUT RULES**:
        1. Output ONLY the requested content in Markdown.
        2. Write ALL headings, labels, and content strictly in the specified **LANGUAGE**; no mixed-language, no English fillers (e.g., "Welcome!").
        3. Maintain consistency with previously defined modules and titles; do not add new modules unless explicitly requested.
        4. Be thorough and professional.
        5. STRICTLY adhere to the requested format.
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

          ${fileContext ? `**REFERENCE MATERIALS:**\nUse these materials as the primary source of information where applicable:\n${fileContext}\n` : ''}

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
    const generationConfig = isJsonMode ? { responseMimeType: "application/json" } : undefined;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig
    });
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
