# Implementation Plan - Unblocking "Generate Materials" with Trainer's Flow

## Goal
Enable the "Generate Materials" functionality by implementing the strict 12-step Trainer's Flow. This ensures that the course content is pedagogically sound (Deep Content) before generating the final materials (Slides, Manuals, etc.).

## User Review Required
> [!IMPORTANT]
> **Architecture Change**: We are moving from a simple "one-shot" generation to a **multi-step sequential generation**. This means the "Generate Materials" button will now trigger a progress modal that steps through the 12 layers of content creation.
>
> **Environment Strictness**: The `environment` variable (LiveWorkshop vs OnlineCourse) will strictly dictate the output format.
> *   **LiveWorkshop** -> Trainer Notes, Slides, Workbook.
> *   **OnlineCourse** -> Video Scripts, Cheat Sheets, Quizzes.

## Proposed Changes

### 1. Data Model & Types
#### [MODIFY] `types/course.ts` (or equivalent)
*   Update `CourseStep` or `CourseContent` interfaces to support the 12 specific content types.
*   Add `CourseGenerationStatus` to track the progress of the 12 steps.

### 2. Edge Function Logic (`generate-course-content`)
#### [MODIFY] `supabase/functions/generate-course-content/index.ts`
*   **New Action**: `generate_step_content`
    *   Input: `step_type` (e.g., 'objectives', 'structure', 'exercises'), `course_context`, `previous_steps`.
    *   Logic: Switch case for ALL 12 steps with specialized prompts.
*   **Prompts**:
    *   **Step 1 (Performance Objectives)**: Focus on "Doing" (Bloom's Taxonomy).
    *   **Step 4 (Learning Methods)**: Suggest specific methods (Roleplay, Case Study) based on content.
    *   **Step 6 (Exercises)**: Generate full details (Purpose, Materials, Instructions, Debrief).
    *   **Step 12 (Video Scripts)**: Strict "Visual vs Audio" format for Online courses.

### 3. Frontend Orchestration
#### [MODIFY] `src/pages/CourseWorkspacePage.tsx` (and components)
*   **"Generate Materials" Button**:
    *   Instead of a single API call, trigger a `GenerationProgressModal`.
*   **`GenerationProgressModal` (New Component)**:
    *   Orchestrates the sequence:
        1.  Call API for Step 1 -> Store in Memory.
        2.  Call API for Step 2 (with Step 1 context) -> Store in Memory.
        3.  ... Repeat for all 12 steps.
    *   **Consolidation Logic (New)**:
        *   At the end of the 12 steps, aggregate the content into 6 final "Livrables":
            1.  **Complete Structure** (Objectives + Structure + Timing)
            2.  **Participant Manual** (Workbook + Stories + Cheat Sheets)
            3.  **Trainer Manual** (Methods + Notes + Manual + Video Scripts)
            4.  **Exercises** (Exercises + Projects)
            5.  **Slide Deck** (Slides)
            6.  **Assessment** (Tests)
        *   Save ONLY these 6 consolidated files to the DB.
    *   Displays a checklist of the 12 steps as they complete.
    *   Allows pausing/resuming (optional, but good for stability).

### 4. Editor Integration
#### [MODIFY] `src/components/CourseEditor.tsx`
*   Ensure the editor can display the specific content type for the current step.
*   For "Deep Content" steps (like "Learning Methods"), display them in a read-only or reference view if they don't map directly to a final slide/page.

## Verification Plan

### Automated Tests
*   **Unit Tests for Prompts**: Create a test file `supabase/functions/tests/prompts_test.ts` (if possible) or a script to verify that prompts are generated correctly for each step type.
*   **Edge Function Test**: Use `deno test` to mock the OpenAI/Gemini call and verify the JSON structure returned for a 'structure' step.

### Manual Verification
1.  **Live Workshop Flow**:
    *   Create a new course "Effective Communication" (Live Workshop).
    *   Chat to generate Blueprint.
    *   Click "Generate Materials".
    *   **Verify**:
        *   Progress modal appears.
        *   Steps 1-12 complete sequentially.
        *   Final output includes **Trainer Notes** (not Video Scripts).
        *   Exercises have "Debrief" sections.
2.  **Online Course Flow**:
    *   Create a new course "Python for Beginners" (Online Course).
    *   Generate Materials.
    *   **Verify**:
        *   Final output includes **Video Scripts** (Visual/Audio columns).
        *   No "Group Activities" generated.
3.  **Import/Export Check**:
    *   Import a DOCX.
    *   Verify it doesn't break the generation flow.
    *   Attempt Export (ZIP) and check contents.
