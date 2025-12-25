import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
const TONE_INSTRUCTIONS = `
=== TONE & STYLE INSTRUCTIONS (MANDATORY) ===

You are creating training materials with a CONVERSATIONAL, BUDDY-TO-BUDDY tone - NOT formal, corporate, or pedagogical.

CRITICAL RULES:

1. BANNED WORDS & PHRASES:
   Never use: "reprezintă", "facilitează", "optimizează", "componentă esențială", "în contextul", "prin prisma", "având în vedere", "prezenta lucrare", "în cele ce urmează".
   
2. VOCABULARY TO USE:
   - "e important" (not "reprezintă o componentă esențială")
   - "ajută" (not "facilitează")
   - "la noi în fabrică/echipă" (not "în contextul organizației")
   - "ca să..." (not "în vederea...")

3. WRITE LIKE YOU TALK:
   - Use contractions where natural for the language (e.g., in Romanian: "n-am", "o să", "e").
   - Start sentences with: "Și", "Dar", "Deci", "Hai să".
   - Ask questions: "Știi ce mi s-a întâmplat?", "De ce?".
   - Use direct address: "tu" (warm, informal) or "dvs" (warm, professional, not cold).

4. STORIES OVER CONCEPTS:
   - EVERY major section must start with a concrete story or scenario (200-400 words).
   - Use real-sounding names: Ionel, Maria, Georgel.
   - Use real contexts: production line, night shift, old warehouse, client meeting.
   - Use real numbers: €800, 40 minutes, 3 pallets.

5. ADMIT REALITY:
   - "Știu, sună ca încă un curs plictisitor..."
   - "E greu să... dar iată de ce merită:"
   - "(da, știu că asta sună corporate, dar...)"

6. STRUCTURE:
   - Hook (question or story)
   - Build (examples and explanations)
   - Close (clear takeaway: "Deci, reține:")
`;

const DEPTH_SPECS = {
  workbook: `
    **DEPTH SPECIFICATIONS (Workbook):**
    - **LENGTH**: The goal is a comprehensive workbook (target 40+ pages total for the whole course).
    - **CONTENT PER MODULE**:
      *   **Explanatory Text**: 800-1200 words per section. NOT just bullet points. Full paragraphs explaining the "Why", "What", and "How".
      *   **Slides**: Reproduce the slide content in text format, then EXPAND on it.
      *   **Stories**: Include at least 1-2 distinct stories/analogies per section (300-500 words each).
      *   **Case Studies**: Include full case studies (1 page each).
      *   **Exercises**: Every exercise must have:
          - Objective
          - Step-by-step instructions
          - Formatted answer space (use visual representations like [___] or tables).
    - **FORMATTING**:
      - Use Markdown headers (##, ###).
      - Use Blockquotes (>) for key takeaways.
      - Use Bold for emphasis.
      - Create "Cheat Sheets" integrated into the flow.
  `,
  slides: `
    **DEPTH SPECIFICATIONS (Slides):**
    - **QUANTITY**: Generate 1 slide per 6-8 minutes of presentation time.
    - **DETAIL PER SLIDE**:
      *   **Visual**: Exact description for a designer (e.g., "Photo of a confused operator looking at a complex dashboard, flat lighting").
      *   **Text**: Minimal on slide (max 5 bullets), but fully expanded in Speaker Notes.
      *   **Speaker Notes**: MANDATORY. 100-150 words per slide. Write the EXACT SCRIPT the speaker should say. Conversational, engaging, including questions to the audience.
  `,
  exercises: `
    **DEPTH SPECIFICATIONS (Exercises):**
    - **QUANTITY**: Ensure 80% of the course time is practical.
    - **DETAIL**:
      *   **Timing**: Specify exact duration (e.g., "20 min").
      *   **Facilitator Instructions**: Step-by-step guide for the trainer (how to split groups, what to distribute).
      *   **Debriefing**: 3-5 specific questions to ask after the exercise to extract learning.
  `,
  manual: `
    **DEPTH SPECIFICATIONS (Trainer Manual):**
    - **FLOW TABLE**: Create a minute-by-minute agenda table.
    - **SCRIPTS**: Write full scripts for Opening, Transitions, and Closing.
    - **TROUBLESHOOTING**: Include "What if..." scenarios (e.g., "What if participants are silent?").
  `
};

const PROMPT_TEMPLATES = {
  workbook_section: `
    ## Module [N]: [Title] ([Duration] ore)

    ### De ce contează acest modul?
    [Intro paragraph 150-200 words explaining importance. Hook the reader.]

    ### [Section Title]
    #### Conceptul de bază
    [Full explanation 300-500 words. Define terms, provide context. NO academic tone.]

    **Exemplu concret:**
    [Story 200-300 words. Context -> Challenge -> Action -> Result]

    ---
    🎯 **EXERCIȚIU [N]: [Title]**
    **Obiectiv:** [What to practice]
    **Durată:** [X] min
    **Instrucțiuni:**
    1. [Step 1]
    2. [Step 2]
    ...
    **Spațiul tău de lucru:**
    [Insert Answer Space / Table]
    ---
  `,
  slide: `
    SLIDE [N]: [Title]
    **Layout**: [Template Name]
    **Visual**: [Detailed Description]
    **Key Points**:
    - [Point 1]
    - [Point 2]
    ...
    **Speaker Notes**: "[Script...]"
  `
};

// --- TYPES ---

export enum GenerationEnvironment {
  LiveWorkshop = 'LiveWorkshop',
  OnlineCourse = 'OnlineCourse',
  Corporate = 'Corporate',
  Academic = 'Academic',
}

export interface Course {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  subject: string;
  target_audience: string;
  environment: GenerationEnvironment;
  language: string;
  progress: number;
  learning_objectives?: string;
  steps?: CourseStep[];
  blueprint?: CourseBlueprint;
  ai_refinement_history?: any[];
}

export interface CourseStep {
  id: string;
  course_id: string;
  user_id: string;
  created_at: string;
  title_key: string;
  content: string;
  is_completed: boolean;
  step_order: number;
}

export interface CourseBlueprint {
  version: '1.0';
  title?: string;
  target_audience?: string;
  modules: CourseModule[];
  estimated_duration?: string;
  generated_at: string;
}

export interface CourseModule {
  id: string;
  title: string;
  learning_objective: string;
  sections: CourseSection[];
}

export interface CourseSection {
  id: string;
  title: string;
  content_type: 'slides' | 'video_script' | 'exercise' | 'reading' | 'quiz';
  order: number;
  content_outline?: string;
}

// --- PROMPTS ---

const getAnalyzeUploadPrompt = (fileName: string, fileContent: string, environment: string) => `
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

const getFillGapsPrompt = (blueprint: any, existingContent: string) => `
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

const getLearningObjectivesPrompt = (course: Course, fileContext: string) => `
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

const getChatOnboardingPrompt = (course: Course, history: string, fileContext: string) => `
  **SYSTEM**: You are an expert Instructional Designer and Curriculum Architect.
  **GOAL**: Conduct an intake interview with the user to design a high-quality course blueprint.
  
  **CONTEXT**:
  - Provisional Title: ${course.title}
  - Subject: ${course.subject}
  - Environment: ${course.environment} (Live Workshop vs Online Course)
  - Language: ${course.language}
  - Initial Objectives: ${course.learning_objectives || 'None provided'}

  ${fileContext ? `**REFERENCE MATERIALS:**\nThe user has provided these materials:\n${fileContext}\n` : ''}

  **CHAT HISTORY**:
  ${history}

  **INSTRUCTIONS**:
  1. **Analyze** the conversation.
  2. **Check Status of Required Info**:
     - **[ ] Objectives**: Defined? (User input OR AI suggestions accepted)
     - **[ ] Level**: Defined? (Beginner/Inter/Advanced)
     - **[ ] Duration**: Defined? (Hours/Days)
     - **[ ] Practice Ratio**: Defined? (e.g., 70/30)

  3. **Logic**:
     - If **Objectives** are missing: Suggest 3-5 objectives based on the title/subject and ask if they look good or if the user wants to add others.
     - If **Level** is missing: Ask "Care este nivelul participanților?"
     - If **Duration** is missing: Ask "Care este durata dorită a cursului?"
     - If **Ratio** is missing: Ask "Ce raport Teorie vs Practică preferi?"
     
     **RULE**: You can combine 2 questions if natural, but DO NOT skip any.
     **RULE**: DO NOT generate the blueprint until ALL 4 items are defined (or user explicitly says "skip").

  4. **Generate Blueprint (ONLY when [x] is checked for all 4)**:
     - **Duration**: Use the user's duration to constrain the module count.
     - **Practice**: If High Practice, use more 'exercise' sections.
     - **Confirmation**: "Am pregătit planul. Iată propunerea:"

  **OUTPUT FORMAT**:
  You must output a VALID JSON object.
  {
    "message": "Question or confirmation",
    "blueprint": null | {
       "version": "1.0",
       "title": "Refined Course Title",
       "target_audience": "Detailed audience description",
       "estimated_duration": "e.g., '8 hours'",
       "generated_at": "[ISO timestamp]",
       "modules": [
         {
           "id": "module-1",
           "title": "Module 1: Name",
           "learning_objective": "Outcome",
           "sections": [
              { "id": "section-1-1", "title": "Section 1.1: Name", "content_type": "slides", "order": 1, "content_outline": "Brief" }
           ]
         }
       ]
    }
  }

  **BLUEPRINT RULES**:
  - "content_type" ∈ {'slides','video_script','exercise','reading','quiz'}.
  - Logical flow that builds complexity.
  - **LiveWorkshop**: emphasize slides and exercises.
  - **OnlineCourse**: emphasize video_script and reading.
  - **Practice Ratio**: STRICTLY respect the requested ratio. If 80% practice, then 4 out of 5 sections should be 'exercise' or 'project'.
  - Include at least one quiz or exercise per module.
  - Each module must have a learning_objective.
  - Use unique IDs like "module-1", "section-1-1".
`;

const getImprovePrompt = (course: Course, stepTitle: string, originalContent: string, fileContext: string) => `
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

const getRefinePrompt = (course: Course, selectedText: string, actionType: string, fileContext: string) => `
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

const getLegacyPrompt = (
    course: Course, 
    stepTitle: string, 
    stepKey: string, 
    fileContext: string, 
    previousStepsContext: string
) => {
    // Define Pedagogical Guidance based on Environment
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

    // Define Specific Instructions based on Step Type
    let specificInstructions = "";
    switch (stepKey) {
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
          ${TONE_INSTRUCTIONS}
        `;
        break;
      case 'course.steps.slides':
        specificInstructions = `
          ${DEPTH_SPECS.slides}
          ${TONE_INSTRUCTIONS}
          Use this template for each slide:
          ${PROMPT_TEMPLATES.slide}
        `;
        break;
      case 'course.steps.cheat_sheets':
        specificInstructions = `
          - Create a **Cheat Sheet / One-Pager** summary.
          - Use tables, checklists, and bold key terms.
          - Focus on "Quick Wins" and actionable tips.
          ${TONE_INSTRUCTIONS}
        `;
        break;
      case 'course.steps.exercises':
      case 'course.steps.projects':
        specificInstructions = `
          ${DEPTH_SPECS.exercises}
          ${TONE_INSTRUCTIONS}
        `;
        break;
      case 'course.steps.manual':
        if (course.environment === 'LiveWorkshop') {
          specificInstructions = `
          ${DEPTH_SPECS.manual}
          ${TONE_INSTRUCTIONS}
          `;
        } else {
          specificInstructions = `
          ${DEPTH_SPECS.workbook}
          ${TONE_INSTRUCTIONS}
          Use this structure for sections:
          ${PROMPT_TEMPLATES.workbook_section}
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
        specificInstructions = `- Generate comprehensive content for this section. ${TONE_INSTRUCTIONS}`;
    }

    return `
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
};

// Helper to get duration enforcement text
const getDurationEnforcement = (blueprintDuration: string) => `
**CRITICAL CONSTRAINT - TOTAL COURSE DURATION**: ${blueprintDuration}
- The ENTIRE course must fit within ${blueprintDuration}. DO NOT EXCEED THIS LIMIT.
- Allocate time proportionally across all modules.
- If generating detailed content, ensure it's appropriate for this duration.
`;

// Helper to get step-specific prompts
const getStepPrompt = (step_type: string, course: Course, blueprintDuration: string) => {
  switch (step_type) {
    case 'performance_objectives':
      return `
        **TASK**: Generate Performance Objectives.
        **GOAL**: Define exactly what participants will be able to DO by the end.
        **INSTRUCTIONS**:
        - Use Bloom's Taxonomy (Action Verbs).
        - Focus on observable behaviors.
        - 6–8 items maximum, in the specified **LANGUAGE**.
        - Headings and labels must be in the specified **LANGUAGE** (no English words like "High-Level", "Welcome").
        - Format as a bulleted list.
      `;
    case 'course_objectives':
      return `
        **TASK**: Generate Course Objectives (strategic).
        **GOAL**: Define the broader goals and business impact.
        **INSTRUCTIONS**:
        - Connect learning to business/personal outcomes.
        - Keep it inspiring but realistic.
        - Write all headings and content strictly in the specified **LANGUAGE**.
        - Do not use English phrases or mixed-language headings.
      `;
    case 'structure':
      return `
        **TASK**: Design the Course Structure (Architecture).
        **GOAL**: Outline the Modules and Lessons.
        **INSTRUCTIONS**:
        - Create a logical flow (Simple to Complex).
        - Define time allocation for each module that TOTALS to ${blueprintDuration}.
        - **GRANULARITY**: Break down broad topics into specific sub-topics/lessons to ensure deep content coverage.
        - Format as a hierarchical outline.
        - All module titles and section titles must be in the specified **LANGUAGE**.
        - Do not introduce English headings or labels.
        - CRITICAL: Ensure all modules combined equal ${blueprintDuration}, not more.
      `;
    case 'learning_methods':
      return `
        **TASK**: Select Learning Methods.
        **GOAL**: Choose the best pedagogical approach for each module.
        **INSTRUCTIONS**:
        - Suggest methods like: Lecture, Case Study, Role Play, Simulation, Discussion.
        - Justify WHY this method fits the content.
        - Map methods to specific modules from the structure.
      `;
    case 'timing_and_flow':
      return `
        **TASK**: Design Timing and Flow (Detailed Agenda).
        **GOAL**: Create a minute-by-minute agenda that covers EVERY module from the structure.
        **INSTRUCTIONS**:
        - **completeness**: You MUST include every single module and lesson from the provided Structure.
        - **granularity**: Break down each module into specific activities (Presentation, Discussion, Break).
        - **timing**: Assign specific minutes to each activity.
        - **total_time**: Ensure the total time matches ${blueprintDuration} EXACTLY.
        - **format**: Use a clear table or list format.
        **LANGUAGE**: ${course.language}.
      `;
    case 'exercises':
      return `
        **TASK**: Design Practical Exercises (Deep Content).
        **GOAL**: Create detailed, actionable instructions for hands-on activities that reinforce learning.
        ${DEPTH_SPECS.exercises}
        ${TONE_INSTRUCTIONS}
        **LANGUAGE**: The content MUST be in **${course.language}**. Do NOT use English headers.
        **CRITICAL INSTRUCTION**: Refer to the MASTER STRUCTURE above. You MUST generate exercises for EVERY module listed there.
      `;
    case 'examples_and_stories':
      return `
        **TASK**: Generate Examples, Stories, and Case Studies.
        **GOAL**: Make the theory concrete and relatable using storytelling.
        **INSTRUCTIONS**:
        - **QUANTITY**: Provide at least **2 concrete examples** and **1 Case Study/Story** per module.
        - **SCOPE**: Cover EVERY module in the MASTER STRUCTURE.
        - **LANGUAGE**: The content MUST be in **${course.language}**.
        ${TONE_INSTRUCTIONS}
      `;
    case 'facilitator_notes':
      return `
        **TASK**: Write Facilitator Notes (Deep Content).
        **GOAL**: Guide the trainer on HOW to deliver the content effectively.
        ${DEPTH_SPECS.manual}
        ${TONE_INSTRUCTIONS}
        **SCOPE**: Write notes for EVERY module in the MASTER STRUCTURE.
        **LANGUAGE**: The content MUST be in **${course.language}**.
      `;
    case 'slides':
      return `
        **TASK**: Generate Slide Content.
        **GOAL**: Create the visual support structure for the presentation.
        ${DEPTH_SPECS.slides}
        ${TONE_INSTRUCTIONS}
        **LANGUAGE**: The content MUST be in **${course.language}**.
        **STRUCTURE**: Generate **5-8 slides** for EVERY module in the MASTER STRUCTURE.
        **VALIDATION**: If the structure has 8 modules, you should generate content for 8 modules.
      `;
    case 'facilitator_manual':
      return `
        **TASK**: Compile Facilitator Manual.
        **GOAL**: A comprehensive, step-by-step guide for the trainer.
        ${DEPTH_SPECS.manual}
        ${TONE_INSTRUCTIONS}
        **SCOPE**: Cover EVERY module in the MASTER STRUCTURE.
      `;
    case 'participant_workbook':
      return `
        **TASK**: Create Participant Workbook.
        **GOAL**: A comprehensive resource for learners to use during the course.
        ${DEPTH_SPECS.workbook}
        ${TONE_INSTRUCTIONS}
        **CRITICAL INSTRUCTION**:
        - You MUST generate content for EVERY module defined in the **MASTER STRUCTURE** above.
        - Do NOT skip any section.
        - **IMPORTANT**: In the Module Header, you MUST include the duration exactly as it appears in the structure (e.g., "(2 ore)").
        - Follow the "Workbook" depth specs strictly (40+ pages target means ~1000 words per module).
        
        Use this structure for sections:
        ${PROMPT_TEMPLATES.workbook_section}
      `;
    case 'video_scripts':
      return `
        **TASK**: Write Video Scripts (for Online Course).
        **GOAL**: Engaging, high-retention scripts for video production.
        **INSTRUCTIONS**:
        - **SOURCE**: Look at the **MASTER STRUCTURE** provided above.
        - **QUANTITY**: Write a script for **EVERY LESSON** defined in that structure.
        - **VALIDATION**: If the structure has 40 lessons, you MUST write 40 scripts. Count them.
        - **LENGTH**: Target approx. 300-500 words per script (3-5 minutes speaking time).
        - Format: **[VISUAL]** vs **[AUDIO]**.
        - Keep sentences short and spoken-word style.
        - Include "Hook", "Content", "Examples", and "Call to Action".
      `;
    default:
      return `**TASK**: Generate content for ${step_type}.`;
  }
};

const getMainPrompt = (
  course: Course,
  step_type: string,
  blueprintDuration: string,
  fileContext: string,
  structuredContext: string,
  previousContext: string,
  fullStructureContext: string = "",
  explicitModuleList: string = ""
) => {
  const specificPrompt = getStepPrompt(step_type, course, blueprintDuration);
  const durationEnforcement = getDurationEnforcement(blueprintDuration);

  return `
    **ROLE**: You are a World-Class Instructional Designer and Curriculum Architect.
    **CONTEXT**: Creating a **${course.environment}** course titled "**${course.title}**".
    **TARGET AUDIENCE**: ${course.target_audience}
    **LANGUAGE**: ${course.language}

    ${durationEnforcement}

    **ENVIRONMENT ADAPTATION (${course.environment}):**
    ${course.environment === 'LiveWorkshop' ? 
      `- Focus on GROUP ACTIVITIES, physical handouts, and face-to-face interaction prompts.
       - Include 'Breaks' and 'Icebreakers'.
       - Use phrases like 'Turn to your neighbor', 'In your groups', 'Raise your hand'.` 
      : ''}
    ${course.environment === 'OnlineCourse' ? 
      `- Focus on SELF-PACED learning, digital quizzes, and screen-friendly formatting.
       - Include 'Reflection moments' instead of group work.
       - Use phrases like 'Pause the video', 'Download the worksheet', 'Think about this'.` 
      : ''}
    ${course.environment === 'Corporate' ? 
      `- Focus on BUSINESS IMPACT, ROI, and workplace application.
       - Use professional scenarios relevant to the industry.
       - Keep exercises time-efficient and results-oriented.` 
      : ''}
    ${course.environment === 'Academic' ? 
      `- Focus on THEORETICAL DEPTH, citations, and critical thinking.
       - Include extensive reading lists and research prompts.
       - Use formal definitions and structured arguments.` 
      : ''}

    ${fileContext ? `**REFERENCE MATERIALS**:\n${fileContext}\n` : ''}

    ${fullStructureContext ? `\n**MASTER COURSE STRUCTURE (SOURCE OF TRUTH)**:\n${fullStructureContext}\n\n**CRITICAL INSTRUCTION**: You MUST refer to the Master Structure above for ALL content generation. Do NOT rely solely on the "Previous Step" snippets if they are truncated.\n` : ''}

    ${explicitModuleList ? `\n**MANDATORY CONTENT CHECKLIST**:\nYou MUST generate content for the following modules:\n${explicitModuleList}\n` : ''}

    ${structuredContext}

    ${previousContext}

    ${specificPrompt}

    **OUTPUT RULES**:
    1. Output ONLY the requested content in Markdown.
    2. Write ALL headings, labels, and content strictly in the specified **LANGUAGE**; no mixed-language, no English fillers (e.g., "Welcome!").
    3. Maintain consistency with previously defined modules and titles; do not add new modules unless explicitly requested.
    4. Be thorough and professional.
  `;
};

// --- ITERATIVE GENERATION HELPERS ---

function getWorkbookModulePrompt(
  course: Course,
  module: any,
  moduleIndex: number,
  fileContext: string
): string {
  
  return `
    **ROLE**: You are an expert Instructional Designer.
    **TASK**: Generate workbook content for **ONE MODULE ONLY**.
    **LANGUAGE**: ${course.language}

    **MODULE DETAILS**:
    - Module Number: ${moduleIndex + 1}
    - Title: ${module.title}
    - Learning Objective: ${module.learning_objective || 'N/A'}
    
    **EXACT STRUCTURE TO FOLLOW (Markdown)**:

    ## ${module.title}

    ### De ce contează acest modul? (200-300 words)
    [Intro paragraph explaining importance. Hook the reader with a relatable problem.]

    ### [Concept Title 1]
    #### Conceptul de bază (300-500 words)
    [Full explanation. Define terms, provide context. NO academic tone - use "buddy-to-buddy" tone.]

    **Exemplu concret:** (200-300 words)
    [Story: Context -> Challenge -> Action -> Result]

    ---
    🎯 **EXERCIȚIU PRACTIC ${moduleIndex + 1}.1**
    **Obiectiv:** [What to practice]
    **Durată:** 15 min
    **Instrucțiuni:**
    1. [Step 1]
    2. [Step 2]
    
    **Spațiul tău de lucru:**
    [Insert Answer Space / Table / Lines]
    ---

    ### Recapitulare ${module.title}
    > **Reține:** [Key takeaway 1]
    > **Reține:** [Key takeaway 2]

    ${TONE_INSTRUCTIONS}

    ${fileContext ? `**REFERENCE MATERIALS:**\n${fileContext}\n` : ''}

    **CRITICAL REQUIREMENTS:**
    1. Generate COMPLETE content for this ONE module only.
    2. Target length: ~1,500 words.
    3. Do NOT start the next module.
    4. Do NOT truncate sentences.
  `;
}

async function generateWorkbookIteratively(
  course: Course,
  blueprint: any,
  fileContext: string,
  genAI: any
): Promise<string> {
  const sections: string[] = [];
  
  // 1. Introduction
  const introPrompt = `
    **TASK**: Generate the Introduction section for the Participant Workbook.
    **COURSE**: ${course.title}
    **TARGET AUDIENCE**: ${course.target_audience}
    **LANGUAGE**: ${course.language}
    
    **CONTENT**:
    - Welcome message
    - How to use this workbook
    - Course Objectives Overview
    
    ${TONE_INSTRUCTIONS}
  `;
  
  console.log("[Iterative] Generating Workbook Intro...");
  const intro = await generateContent(introPrompt, false, genAI);
  sections.push(intro);

  // 2. Modules (Parallel Batches)
  if (blueprint && Array.isArray(blueprint.modules)) {
      const modules = blueprint.modules;
      const BATCH_SIZE = 3; // Process 3 modules at a time
      
      for (let i = 0; i < modules.length; i += BATCH_SIZE) {
          const batch = modules.slice(i, i + BATCH_SIZE);
          console.log(`[Iterative] Generating Workbook Batch ${Math.floor(i/BATCH_SIZE)+1} (${batch.length} modules)...`);
          
          const batchResults = await Promise.all(batch.map(async (module, index) => {
              const globalIndex = i + index;
              const modulePrompt = getWorkbookModulePrompt(course, module, globalIndex, fileContext);
              try {
                  let content = await generateContent(modulePrompt, false, genAI);
                  // Simple validation for length
                  if (content.length < 1000) {
                      console.warn(`[Iterative] Module ${globalIndex+1} too short. Retrying...`);
                      const retryPrompt = `${modulePrompt}\n\n**SYSTEM NOTICE**: Your previous output was too short. Please expand the content to be at least 1500 words. Add more examples and details.`;
                      content = await generateContent(retryPrompt, false, genAI);
                  }
                  return content;
              } catch (err) {
                  console.error(`Error generating module ${module.title}:`, err);
                  return `## Module ${globalIndex+1}: ${module.title}\n\n(Content generation failed. Please consult the slides for this section.)`;
              }
          }));
          
          sections.push(...batchResults);
          
          // Small delay between batches to be safe
          if (i + BATCH_SIZE < modules.length) {
             await new Promise(r => setTimeout(r, 1000));
          }
      }
  }

  // 3. Conclusion
  const conclusionPrompt = `
    **TASK**: Generate the Conclusion section for the Participant Workbook.
    **COURSE**: ${course.title}
    **LANGUAGE**: ${course.language}
    
    **CONTENT**:
    - Final encouraging words
    - "What's Next" action plan
    - Additional Resources placeholders
    
    ${TONE_INSTRUCTIONS}
  `;
  console.log("[Iterative] Generating Workbook Conclusion...");
  const conclusion = await generateContent(conclusionPrompt, false, genAI);
  sections.push(conclusion);

  return sections.join('\n\n---\n\n');
}

// --- AI CLIENT ---

async function generateWithKimi(prompt: string, isJsonMode: boolean): Promise<string> {
  const base = Deno.env.get('MOONSHOT_API_URL') ?? Deno.env.get('KIMI_API_URL') ?? 'https://api.moonshot.ai/v1';
  const url = base.endsWith('/v1') ? `${base}/chat/completions` : (base.endsWith('/chat/completions') ? base : `${base}/chat/completions`);
  const key = Deno.env.get('MOONSHOT_API_KEY') ?? Deno.env.get('KIMI_API_KEY');
  if (!key) throw new Error('MOONSHOT_API_KEY (or KIMI_API_KEY) is not set.');
  
  const isMoonshotKey = !!Deno.env.get('MOONSHOT_API_KEY');
  const model = Deno.env.get('MOONSHOT_MODEL') ?? Deno.env.get('KIMI_MODEL') ?? (isMoonshotKey ? 'moonshot-v1-8k' : 'kimi-k2-turbo-preview');
  
  const body: {
    model: string;
    messages: { role: string; content: string }[];
    response_format?: { type: string };
    temperature?: number;
  } = {
    model,
    messages: [{ role: 'user', content: prompt }]
  };
  
  if (isJsonMode) {
    body.response_format = { type: 'json_object' };
  }
  
  body.temperature = 0.6;
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(t || `Kimi error ${resp.status}`);
  }
  
  const data = await resp.json();
  let text = '';
  try {
    text = (data?.choices?.[0]?.message?.content ?? '') as string;
  } catch (_) { void 0; }
  
  if (!text || typeof text !== 'string') {
    text = JSON.stringify(data);
  }
  
  return text;
}

async function generateContent(
  prompt: string, 
  isJsonMode: boolean, 
  genAI: GoogleGenerativeAI | null
): Promise<string> {
  // 1. Try Google Gemini (Flash Lite -> Flash -> Pro/Standard)
  if (genAI) {
    const modelsToTry = [
      'gemini-2.0-flash-lite-preview-02-05',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: {
                responseMimeType: isJsonMode ? "application/json" : "text/plain"
            }
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) return text;
      } catch (err) {
        console.warn(`Gemini ${modelName} failed:`, err);
        // Continue to next model
      }
    }
  }

  // 2. Fallback to Kimi/Moonshot
  console.log("Falling back to Kimi/Moonshot...");
  return await generateWithKimi(prompt, isJsonMode);
}

// --- VALIDATION HELPER ---
function validateGeneratedContent(text: string, step_type: string, blueprint: any): { isValid: boolean; reason?: string } {
  if (!text || text.length < 100) return { isValid: false, reason: "Content too short" };

  // Validation for specific steps
  if (step_type === 'structure' || step_type === 'timing_and_flow') {
     // Check if it looks like a structure (has modules)
     if (!text.toLowerCase().includes('modul') && !text.toLowerCase().includes('module')) {
        return { isValid: false, reason: "Missing 'Module' keywords in structure" };
     }
  }

  if (step_type === 'participant_workbook') {
     // Check for significant length/depth
     if (text.length < 2000) {
        return { isValid: false, reason: "Workbook content dangerously short (<2000 chars)" };
     }
     
     // Check if it follows the template structure roughly
     if (!text.includes('###') && !text.includes('**')) {
        return { isValid: false, reason: "Missing Markdown formatting" };
     }
  }

  // --- MODULE COUNT VALIDATION (GLOBAL) ---
  // If we have a blueprint with modules, ensure the output mentions roughly the same number of modules
  if (step_type !== 'structure' && step_type !== 'course_objectives' && step_type !== 'performance_objectives' && blueprint?.modules && Array.isArray(blueprint.modules)) {
      const expectedCount = blueprint.modules.length;
      if (expectedCount > 0) {
          // 1. Strict Count Check
          const matches = (text.match(/(modulul|module|section|week)\s+\d+/gi) || []).length;
          
          if (step_type === 'video_scripts') {
               const visualMatches = (text.match(/\[VISUAL\]/gi) || []).length;
               // We expect at least 1 script per module (usually more, but 1 is absolute minimum)
               if (visualMatches < expectedCount) {
                   return { isValid: false, reason: `Expected at least ${expectedCount} video scripts (one per module), found only ${visualMatches} [VISUAL] tags. Did you skip modules?` };
               }
          } else {
               // Stricter check: Allow max 1 missing module (e.g. sometimes Intro is skipped or combined)
               if (matches < expectedCount - 1) {
                   return { isValid: false, reason: `Output seems to miss modules. Expected ${expectedCount} modules (based on Blueprint), found mention of ${matches}. Please ensure you cover ALL modules.` };
               }
          }

          // 2. Specific Module Presence Check (Core Title Check)
          // Check if specific module titles are present in the text
          let missingModules: string[] = [];
          for (const m of blueprint.modules) {
              const title = m.title || "";
              // Extract core part (e.g., "Modulul 1") or just use the first few words if it doesn't have "Modulul"
              const parts = title.split(':');
              const core = parts[0].trim(); // "Modulul 1"
              
              if (core.length > 2) {
                  // Escape special characters for regex
                  const pattern = new RegExp(core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                  if (!pattern.test(text)) {
                      missingModules.push(core);
                  }
              }
          }
          
          // If we are missing specific headers for more than 1 module, fail validation
          if (missingModules.length > 1) {
               return { 
                   isValid: false, 
                   reason: `Missing content for modules: ${missingModules.join(', ')}. Please generate content for ALL modules.` 
               };
          }
      }
  }

  return { isValid: true };
}

// --- HASH HELPER ---
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- STEP TYPE NORMALIZER ---
function normalizeStepType(s?: string): string {
  if (!s) return '';
  let t = String(s).trim();
  // strip common prefixes
  t = t.replace(/^generation\.steps\./i, '')
       .replace(/^course\.steps\./i, '')
       .replace(/^steps\./i, '');
  // camelCase to snake_case
  t = t.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  // dots/hyphens to underscores
  t = t.replace(/[.\-]/g, '_');
  return t.toLowerCase();
}

// --- MAIN SERVER ---

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
      previous_steps,
      context_summary,
      part_type,
      module_data,
      module_index
    } = await req.json();

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');
    const globalHeaders: Record<string, string> = {};
    if (authHeader && typeof authHeader === 'string' && authHeader.trim().length > 0) {
      globalHeaders['Authorization'] = authHeader;
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: globalHeaders },
    });

    const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

    const stepTitle = step ? (STEP_TITLES[step.title_key] || "Unknown Step") : "General";
    
    console.log(`[Edge] Request: action=${action}, step_type=${step_type}, step_key=${step?.title_key}`);

    let prompt;
    let isJsonMode = false;

    let fileContext = "";
    if (context_files && context_files.length > 0) {
      const { data: files, error } = await supabase
        .from('course_files')
        .select('filename, extracted_text')
        .in('id', context_files);

      if (!error && Array.isArray(files)) {
        const parts = files.map((f: { filename: string; extracted_text: string | null }) => {
          const name = (f.filename || '').trim();
          const text = (f.extracted_text || '').trim().replace(/\s+/g, ' ');
          const snippet = text.length > 800 ? text.substring(0, 800) + '…' : text;
          return `• ${name}: ${snippet}`;
        });
        fileContext = parts.join('\n');
      }
    }


    if (action === 'ping') {
      return new Response(JSON.stringify({ message: 'pong' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (action === 'provider_status') {
      const googleConfigured = !!Deno.env.get('GEMINI_API_KEY');
      const moonshotConfigured = !!(Deno.env.get('MOONSHOT_API_KEY') || Deno.env.get('KIMI_API_KEY'));
      const activeProvider = googleConfigured ? 'google' : (moonshotConfigured ? 'moonshot' : 'none');
      return new Response(JSON.stringify({ googleConfigured, moonshotConfigured, activeProvider }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (action === 'analyze_upload') {
      isJsonMode = true;
      prompt = getAnalyzeUploadPrompt(fileName, fileContent, environment);
    } else if (action === 'fill_gaps') {
      isJsonMode = true;
      prompt = getFillGapsPrompt(blueprint, existingContent);
    } else if (action === 'generate_learning_objectives') {
      isJsonMode = true;
      prompt = getLearningObjectivesPrompt(course, fileContext);
    } else if (action === 'chat_onboarding') {
      isJsonMode = true;
      const conversationHistory = messages || chat_history || [];
      const history = (conversationHistory as Array<{ role: string; content: string }>)
        .map((m) => `${(m.role || 'user').toUpperCase()}: ${m.content || ''}`)
        .join('\n');
      
      prompt = getChatOnboardingPrompt(course, history, fileContext);
    } else if (action === 'improve') {
      prompt = getImprovePrompt(course, stepTitle, originalContent, fileContext);
    } else if (action === 'refine') {
      const { selectedText, actionType } = refinePayload || {};

      if (!selectedText || String(selectedText).trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Empty selection' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }

      prompt = getRefinePrompt(course, selectedText, actionType, fileContext);

    } else if (action === 'generate_workbook_part') {
      // --- NEW: Granular Workbook Generation to avoid Timeouts ---
      
      let text = '';
      if (part_type === 'intro') {
        const introPrompt = `
          **TASK**: Generate the Introduction section for the Participant Workbook.
          **COURSE**: ${course.title}
          **TARGET AUDIENCE**: ${course.target_audience}
          **LANGUAGE**: ${course.language}
          
          **CONTENT**:
          - Welcome message
          - How to use this workbook
          - Course Objectives Overview
          
          ${TONE_INSTRUCTIONS}
        `;
        text = await generateContent(introPrompt, false, genAI);

      } else if (part_type === 'outro') {
        const conclusionPrompt = `
          **TASK**: Generate the Conclusion section for the Participant Workbook.
          **COURSE**: ${course.title}
          **LANGUAGE**: ${course.language}
          
          **CONTENT**:
          - Final encouraging words
          - "What's Next" action plan
          - Additional Resources placeholders
          
          ${TONE_INSTRUCTIONS}
        `;
        text = await generateContent(conclusionPrompt, false, genAI);

      } else if (part_type === 'module') {
        if (!module_data) throw new Error("Missing module_data for part_type='module'");
        const prompt = getWorkbookModulePrompt(course, module_data, module_index || 0, fileContext);
        text = await generateContent(prompt, false, genAI);
        
        // Simple length check retry
        if (text.length < 1000) {
            console.warn(`[WorkbookPart] Module content too short. Retrying...`);
            const retryPrompt = `${prompt}\n\n**SYSTEM NOTICE**: Your previous output was too short. Please expand the content to be at least 1500 words. Add more examples and details.`;
            text = await generateContent(retryPrompt, false, genAI);
        }
      }

      return new Response(JSON.stringify({ content: text }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
      });

    } else if (action === 'generate_step_content') {
      // --- NEW: 12-STEP TRAINER FLOW GENERATION ---
      
      let fullStructureContext = "";
      
      const previousContext = previous_steps
        ? (previous_steps as Array<{ step_type: string; content: string }>)
            .map((s) => {
                // Special handling for 'structure': we want to preserve it fully if possible, or at least a very large chunk
                // because it is the "Source of Truth" for all subsequent steps.
                if (s.step_type === 'structure' || s.step_type === 'course_steps_structure') {
                    const content = s.content || '';
                    // Keep up to 20k chars for the structure to ensure we don't lose modules 7-8 etc.
                    fullStructureContext = content.substring(0, 25000); 
                    return `\n--- PREVIOUS STEP: ${s.step_type} ---\n${content.substring(0, 2000)}... (refer to MASTER STRUCTURE above for full content)`;
                }
                return `\n--- PREVIOUS STEP: ${s.step_type} ---\n${(s.content || '').substring(0, 2000)}`;
            })
            .join('\n')
        : "";

      const structuredContext = context_summary
        ? `\n**STRUCTURED CONTEXT**\nModules: ${(context_summary?.modules || []).join('; ')}\nDurations: ${(context_summary?.durations || []).join(', ')}\nExercisesCount: ${context_summary?.exercisesCount ?? 0}\n`
        : "";

      const blueprintDuration = course.blueprint?.estimated_duration || "4 hours";
      
      // Use the modular helper to generate the prompt
      const normalizedStepType = normalizeStepType(step_type);
      
      // Build Explicit Module List for better AI compliance
      let explicitModuleList = "";
      if (course.blueprint?.modules && Array.isArray(course.blueprint.modules)) {
          explicitModuleList = course.blueprint.modules
              .map((m: any, i: number) => `${i+1}. ${m.title}`)
              .join('\n');
      }

      // --- ITERATIVE GENERATION CHECK ---
      // Check if we should use iterative generation for this step
      if (normalizedStepType === 'participant_workbook' && course.blueprint?.modules && course.blueprint.modules.length > 0) {
          console.log(`Using ITERATIVE generation for ${normalizedStepType} (Modules: ${course.blueprint.modules.length})`);
          // We generate iteratively and skip the standard "generateContent" call below
          // Note: we assign it to 'prompt' variable temporarily if we wanted to standard flow, 
          // but here we want to assign to 'text' directly.
          // However, 'text' is defined inside the try block below.
          // So we need to restructure slightly or use a flag.
          
          // Actually, we can just set a special flag or handle it right here?
          // The cleanest way is to handle it in the "AI EXECUTION" block, or execute it here and set 'text'.
          // But 'text' is scoped inside the try block.
          // Let's modify the Prompt generation to return a special object? No.
          
          // Let's execute it here and pass it down via a variable, or move this logic inside the try block.
          // Moving inside the try block is safer.
      }
      
      prompt = getMainPrompt(
        course,
        normalizedStepType,
        blueprintDuration,
        fileContext,
        structuredContext,
        previousContext,
        fullStructureContext,
        explicitModuleList
      );

    } else {
      // --- GENERATION PROMPT (LEGACY / FALLBACK) ---

      // 1. Build Context from Previous Steps
      const previousStepsContext = Array.isArray(course.steps)
        ? (course.steps as Array<{ step_order: number; content?: string; title_key: string }>)
            .filter((s) => typeof s.step_order === 'number' && s.step_order < step.step_order && !!s.content)
            .map((s) => `--- PREVIOUS STEP: ${STEP_TITLES[s.title_key]} ---\n${(s.content || '').substring(0, 500)}...\n`)
            .join('\n')
        : "";

      prompt = getLegacyPrompt(course, stepTitle, step.title_key, fileContext, previousStepsContext);
    }

    // --- AI EXECUTION VIA HELPER ---
    try {
        let text = '';
        const normalizedStepType = step_type ? normalizeStepType(step_type) : '';
        const isIterative = !isJsonMode && 
                            action === 'generate_step_content' && 
                            normalizedStepType === 'participant_workbook' && 
                            course.blueprint?.modules?.length > 0;

        // --- CACHE LAYER ---
        const cacheKey = await sha256(prompt + (isJsonMode ? '_json' : ''));
        
        // Skip cache for Iterative mode as it's composite content
        if (!isIterative) {
            try {
                const { data: cached } = await supabase
                    .from('ai_cache')
                    .select('response')
                    .eq('prompt_hash', cacheKey)
                    .single();
                
                if (cached && cached.response) {
                    console.log(`[Cache] Hit for ${cacheKey.substring(0, 8)}`);
                    text = cached.response;
                }
            } catch (err) {
                console.warn("[Cache] Read failed (ignoring):", err);
            }
        }

        if (!text) {
             if (isIterative) {
                 console.log(`[Main] Executing Iterative Generation for ${normalizedStepType}`);
                 text = await generateWorkbookIteratively(course, course.blueprint, fileContext, genAI);
             } else {
                 text = await generateContent(prompt, isJsonMode, genAI);
             }
             
             // Save to cache (standard only)
             if (text && text.length > 20 && !isIterative) {
                 try {
                     await supabase.from('ai_cache').insert({
                         prompt_hash: cacheKey,
                         prompt: prompt.substring(0, 10000), 
                         response: text,
                         model: 'unknown'
                     });
                 } catch (err) {
                     console.warn("[Cache] Write failed:", err);
                 }
             }
        }
        
        // --- VALIDATION LAYER ---
        // Only validate if we have a step_type (meaning it's the new flow) and it's not a JSON mode call
        // Skip validation for Iterative mode because it validates internally per module
        if (step_type && !isJsonMode && action === 'generate_step_content' && !isIterative) {
            const normalized = normalizeStepType(step_type);
            console.log(`Validating content for ${normalized}...`);
            
            let validation = validateGeneratedContent(text, normalized, blueprint);
            let attempts = 0;
            const maxRetries = 2;

            while (!validation.isValid && attempts < maxRetries) {
                attempts++;
                console.warn(`Validation failed for ${normalized} (Retry ${attempts}/${maxRetries}): ${validation.reason}`);
                
                const retryPrompt = `${prompt}\n\n**SYSTEM NOTICE**: Your previous output was rejected because: ${validation.reason}. \n\n**CRITICAL**: You MUST fix this. Check the Master Structure and ensure you cover ALL required modules/sections as listed in the MANDATORY CONTENT CHECKLIST.`;
                
                try {
                    text = await generateContent(retryPrompt, isJsonMode, genAI);
                    // Re-validate the new content
                    validation = validateGeneratedContent(text, normalized, blueprint);
                } catch (err) {
                    console.error(`Retry ${attempts} failed with error:`, err);
                    break; // Stop retrying if generation errors out
                }
            }

            if (!validation.isValid) {
                console.warn(`Validation gave up for ${normalized} after ${attempts} retries. Reason: ${validation.reason}`);
            } else if (attempts > 0) {
                console.log(`Validation succeeded for ${normalized} after ${attempts} retries.`);
            }
        }
        
        // Post-processing for chat_onboarding (validation logic)
        if (action === 'chat_onboarding') {
            try {
              const obj = JSON.parse(text || '{}');
              const bp = obj?.blueprint;
              const msg = (obj?.message || '').trim();
              
              // Validate Blueprint
              const bpOk = bp && 
                           Array.isArray(bp.modules) && 
                           bp.modules.length >= 1 && // Relaxed from 2 to 1
                           typeof bp.target_audience === 'string';

              // If we have a valid blueprint, return it regardless of the message content.
              if (bpOk) {
                 return new Response(JSON.stringify({ content: JSON.stringify(obj) }), { 
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
                    status: 200 
                 });
              }

              // If NO valid blueprint, ensure the message is treated as a follow-up question.
              const question = /\?/.test(msg); // Check if there is ANY question mark
              
              if (!bpOk) {
                // If the AI didn't provide a blueprint, it MUST be asking a question.
                // If for some reason it didn't ask a question but didn't give a blueprint, force a default follow-up.
                const followMsg = (msg && msg.length > 5) ? msg : 'Pentru a crea un curs de calitate, am nevoie de detalii suplimentare despre obiectivele de învățare și audiență.';
                
                const follow = { 
                    message: followMsg, 
                    blueprint: null 
                };
                return new Response(JSON.stringify({ content: JSON.stringify(follow) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
              }
            } catch { /* ignore parse errors; return original */ }
        }

        return new Response(JSON.stringify({ content: text }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (e) {
        // Error handling
        const msg = e instanceof Error ? e.message : String(e);
        const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("quota");
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: isRateLimit ? 429 : 500
        });
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : '';
    console.error("CRITICAL ERROR in Edge Function:", message, stack, error);
    
    const isRateLimit = message.includes("429") || message.toLowerCase().includes("quota");
    return new Response(JSON.stringify({ 
      error: message,
      stack: stack, 
      details: String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: isRateLimit ? 429 : 500
    });
  }
});
