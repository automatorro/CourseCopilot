# CourseCopilot: Master Implementation Plan

## Executive Summary
This plan outlines the strategic repositioning of **CourseCopilot** from a simple text generator to a world-class **Course Copilot** (comparable to coursebox.ai). The core philosophy is shifted to follow a professional **Trainer's Flow**, ensuring deep, pedagogically sound content generation before visual formatting.

---

## I. Project Context & Status Audit (Current State)

### 1. Legacy Architecture (Stable)
*   **Editor Flow**: 5-step stable flow (Slides, Structure, Exercises, Manual, Tests).
*   **Import**: DOCX import works excellent (~100%).
*   **Export**: ZIP export stable. **Critical Issue**: PPTX export is unreadable.
*   **Content Quality**: Generated outputs are too short and insufficient for real courses.

### 2. New Implementations (Current Development)
*   **Variable Modal**: Excellent, refactored.
*   **AI Chat**: Works, generates Blueprint Preview.
*   **BLOCKER**: "Generate Materials" button is non-functional. Missing logic to bridge Blueprint -> Final Content.
*   **Pending Features**: "Refine with AI" and "Edit Manuals" are not implemented.
*   **Conflict**: Imported documents in the legacy editor appear but cannot be verified due to edit restrictions.

### 3. Missing/Skipped Steps (from previous plan)
*   **Step 2.3**: Patch-based editing (Partial/Unclear).
*   **Step 2.4**: UI Updates for refinement (Skipped).
*   **Step 3.5**: Reverse Engineering Mode (Skipped).

---

## II. Strategic Repositioning: The Trainer's Flow
To achieve "Copilot" status, the generation logic **MUST** follow this strict pedagogical sequence (The 12 Steps):

1.  **Performance Objectives**: "What must participants do/know at the end?"
2.  **Course Objectives**: High-level goals.
3.  **Structure (Architecture)**: Modules and flow.
4.  **Learning Methods**: Selecting the right approach (Lecture, Roleplay, etc.).
5.  **Timing & Flow**: Duration and pacing.
6.  **Exercises**: Full design (Purpose, Materials, Action, Debrief).
7.  **Examples & Stories**: Case studies and metaphors.
8.  **Facilitator Notes**: Guide for the trainer.
9.  **Slides**: Visual support (generated *after* content).
10. **Facilitator Manual**: Compiled guide.
11. **Participant Workbook**: Student materials.
12. **Video Scripts**: (If Online Course environment).

---

## III. Revised Implementation Roadmap

### Phase 1: Unblocking Generation (The Core Generator) 🎯 **URGENT**
**Goal**: Enable the "Generate Materials" button by implementing the 12-Step Trainer's Flow.

#### 1.1 Architecture & Data Model
*   Define `CourseContent` schema to support the 12 layers.
*   Ensure `environment` (Live vs Online) dictates the output format (Step 12 vs Step 10/11).

#### 1.2 The Generation Pipeline (Edge Functions)
*   **Step 1-5 (Foundations)**: Generate Objectives, Structure, Methods, Timing.
*   **Step 6-8 (Deep Content)**: Generate Exercises, Examples, Facilitator Notes.
*   **Step 9-12 (Materials)**: Generate Slides, Manuals, Scripts based on Deep Content.
*   **Action**: Create chained Edge Functions or a robust orchestrator to handle this sequence without timeout.

#### 1.3 UI Integration
*   Connect "Generate Materials" button to the new pipeline.
*   Show progress indicators for each stage of the 12-step generation.

### Phase 2: The Copilot Editor (Refinement & Polish)
**Goal**: Allow users to refine the generated content without breaking the structure.

#### 2.1 Patch-Based Editing (Revived Step 2.3)
*   Implement "Refine Selection" to modify specific parts (e.g., "Make this exercise more interactive") without regenerating the whole course.

#### 2.2 Import/Export Fixes
*   **Investigate Import**: Fix the sidebar clutter from imported docs. Ensure imported content feeds into the Context for generation.
*   **Fix PPTX Export**: Ensure slides generated in Step 9 are exportable to valid PPTX.

### Phase 3: Advanced Capabilities
*   **Reverse Engineering (Step 3.5)**: Generate a course *from* an uploaded PPTX/DOCX.
*   **Quality Inspector**: AI analyzes the pedagogical flow and suggests improvements.

---

## IV. Immediate Next Steps (Action Plan)
1.  **Technical Specification**: Design the JSON structure for the 12-step content.
2.  **Edge Function Logic**: Implement the "Generate Materials" orchestrator.
3.  **Fix Import/Export**: Parallel investigation into PPTX and Import display issues.
