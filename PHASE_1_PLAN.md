# Implementation Plan - Phase 1: Intelligent Onboarding

## Analysis: Current vs Target Architecture

### Current State
- **Data Model**: `Course` has a linear list of `CourseStep` items.
- **Generation**: Rigid `switch` statement in Edge Function based on hardcoded step keys.
- **UI**: Linear navigation (Next/Prev step), single editor per step.
- **Context**: Very limited context passing between steps (string concatenation).

### Target State
- **Data Model**: `Course` needs `meta` (initial form data), `blueprint` (AI-generated structure), and `imports` (raw materials).
- **Generation**: Dynamic generation based on the `blueprint`.
- **UI**: "Central Editor" allowing non-linear access to all modules/sections.
- **Context**: "Course Context" object acting as a single source of truth.

### Gap Analysis
| Feature | Current | Target | Action |
| :--- | :--- | :--- | :--- |
| **Onboarding** | Simple Form -> Immediate Generation | Form -> AI Chat -> Blueprint | **Replace** |
| **Structure** | Fixed Steps (Structure, Slides, etc.) | Dynamic Modules & Sections | **Replace** |
| **Editor** | Single Step Editor | Multi-view Central Editor | **Replace** |
| **Content** | Isolated Strings | Structured Data (JSON/Markdown) | **Refactor** |

### Risks & Mitigations
- **Risk**: Breaking existing courses.
    - **Mitigation**: Keep `CourseStep` for legacy support, but new courses use `blueprint`.
- **Risk**: AI Hallucinations in Blueprint.
    - **Mitigation**: User review step for Blueprint before content generation.

## Phase 1: Intelligent Onboarding

### Goal
Replace the immediate "Create" action with an interactive AI chat that gathers requirements and generates a robust Course Blueprint.

### User Review Required
> [!IMPORTANT]
> This phase introduces a new database column `blueprint` to the `courses` table. This is a non-breaking change for existing columns but essential for new courses.

### Proposed Changes

#### Database
- **[MODIFY]** `courses` table: Add `blueprint` (JSONB) and `chat_history` (JSONB) columns.

#### Frontend
- **[MODIFY]** `src/types.ts`: Update `Course` interface to include `blueprint` and `chat_history`.
- **[NEW]** `src/components/OnboardingChat.tsx`: New component for the chat interface.
- **[MODIFY]** `src/components/NewCourseModal.tsx`: Redirect to Onboarding Chat instead of creating course immediately (or create course in "draft" state).
- **[MODIFY]** `src/pages/CourseWorkspacePage.tsx`:
    - Check if `blueprint` exists.
    - If NO `blueprint` -> Show `OnboardingChat`.
    - If YES `blueprint` -> Show (Placeholder) Central Editor.

#### Backend (Edge Functions)
- **[MODIFY]** `supabase/functions/generate-course-content/index.ts`:
    - Add new action `generate_blueprint`.
    - Implement logic to generate Learning Objectives (LOs) and Structure based on chat.

### Verification Plan

#### Automated Tests
- None currently exist. Will rely on manual verification for this UI-heavy phase.

#### Manual Verification
1.  **Create New Course**:
    - Fill initial form.
    - Verify redirection to Chat Interface.
2.  **Chat Interaction**:
    - Answer AI questions.
    - Verify AI responses are relevant.
3.  **Blueprint Generation**:
    - Complete chat.
    - Verify `blueprint` is saved to Supabase (via Dashboard or Console logs).
    - Verify UI transitions to "Editor" (placeholder).
