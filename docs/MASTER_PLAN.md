# AI Course Co-Pilot: Master Implementation Plan

## Executive Summary

This plan outlines the evolution of **AI Course Co-Pilot** from a "content generator" to a true "AI co-pilot" for course creation. Based on analysis of the ChatGPT discussion and audit of the current codebase, we have identified **4 strategic phases** with clear dependencies and risk mitigation.

**Current State**: Phase 1 (Intelligent Onboarding) is ~90% complete. The app can create courses via AI chat, generate blueprints, and populate the editor.

**Critical Next Step**: Complete Phase 1.1 (1-2 hours) to ensure foundation is solid, THEN proceed to Phase 2.

---

## Core Principles (From ChatGPT Discussion)

1. **Co-Pilot, Not Generator**: Users should refine and improve content iteratively, not regenerate from scratch.
2. **Patch-Based Editing**: AI modifies only selected text, preserving manual edits and context.
3. **Context-Aware**: AI remembers course metadata (audience, goals, environment) at every step.
4. **Flexible Import**: Users can upload materials at any stage to influence content.
5. **Live vs Online**: Respect the `environment` field (LiveWorkshop = Trainer Notes; OnlineCourse = Video Scripts).

---

## Phase 1: Intelligent Onboarding ✅ (90% Complete)

**Goal**: Replace static forms with AI chat that builds a robust Course Blueprint.

### Completed
- [x] Database schema (`blueprint`, `ai_refinement_history` columns)
- [x] `NewCourseModal` with initial form
- [x] `OnboardingChat` component (interactive AI conversation)
- [x] `BlueprintReview` component (user approves blueprint)
- [x] `createCourseStepsFromBlueprint()` (converts blueprint → database rows)
- [x] Routing logic in `CourseWorkspacePage`

### Phase 1.1: Audit Live vs Online Logic 🎯 (NEXT - Day 1)

**Why This Matters**: Foundation for ALL future content generation. If this is wrong, every phase inherits the bug.

#### Tasks
1. **Audit Edge Function Prompts**
   - **File**: `supabase/functions/generate-course-content/index.ts`
   - **Check**: Does the prompt say "If environment is LiveWorkshop, generate Trainer Notes; if OnlineCourse, generate Video Scripts"?
   - **Fix**: Update prompts to explicitly check `course.environment`

2. **Audit Blueprint Generation**
   - **File**: Same Edge Function, `chat_onboarding` action
   - **Check**: Does it respect `environment` when proposing content types?
   - **Fix**: Ensure blueprint suggests appropriate content types

3. **Test Both Environments**
   - Create a Live Workshop course → Verify it generates Trainer Notes
   - Create an Online Course → Verify it generates Video Scripts
   - Document any inconsistencies

**Effort**: 1-2 hours
**Risk**: Low (just prompt adjustments)
**Blocker for**: Phase 2, 3.5 (all content generation depends on this)

---

## Phase 2: Patch-Based Editor 🎯 (Days 2-5)

**Goal**: Transform the editor into an AI-assisted workspace where users refine specific sections.

**Why This Matters**: Without this, we can't call it a "co-pilot". Current "Refine" regenerates entire step, losing manual edits.

**Dependencies**: Phase 1.1 must be complete (ensures correct content types).

### Implementation

#### 2.1 Capture Text Selection (Day 2)
- **Task**: Modify `TinyEditor.tsx` to track user's selected text
- **Technical**: Use TinyMCE's `editor.selection.getContent()` API
- **Output**: `{ selectedText, selectionStart, selectionEnd }`
- **Effort**: 2-3 hours

#### 2.2 Update Edge Function for Patch Mode (Days 2-3)
- **Task**: Add new action `refine_selection` to `generate-course-content`
- **Input**: 
  ```json
  {
    "action": "refine_selection",
    "selectedText": "...",
    "fullContext": "...", // surrounding paragraphs
    "instruction": "simplify",
    "courseMetadata": { "environment": "LiveWorkshop", ... }
  }
  ```
- **Output**:
  ```json
  {
    "replacement": "...", // ONLY refined version of selectedText
    "notes": "Changed X to Y for clarity"
  }
  ```
- **Critical**: AI must NOT hallucinate outside the selection
- **Effort**: 4-6 hours

#### 2.3 Apply Patch in Editor (Day 3)
- **Task**: Replace only the selection in TinyMCE with AI's `replacement`
- **Technical**: `editor.selection.setContent(replacement)`
- **Effort**: 1-2 hours

#### 2.4 Update UI (Days 4-5)
- **Task**: Change "Refine" dropdown to work on selection
- **UX**: Show tooltip "Select text first" if no selection
- **Testing**: Verify manual edits are preserved
- **Effort**: 2-3 hours

**Total Effort**: 9-14 hours
**Risk**: Medium (prompt engineering)
**Unlocks**: True co-pilot experience

---

## Phase 3.5: Reverse Engineering Mode 🎯 (Week 2)

**Goal**: Enable users to upload existing presentations/materials and generate a complete course for both Live and Online delivery.

**Why This Matters**: 
- Real-world need (most trainers have existing materials)
- Competitive advantage ("Upload and transform")
- Reduces friction (users don't start from scratch)

**Dependencies**: Phase 2 (users need to refine the generated content from uploads).

### Use Case
User uploads `Sales_Training_2023.pptx` → AI analyzes structure → Proposes Blueprint → Generates all missing materials (Trainer Notes, Video Scripts, Exercises, Quizzes) → User exports complete course package.

### Implementation

#### 3.5.1 Enhanced File Analysis (Days 1-2)
- **Task**: Parse PPTX structure (slides, notes, order)
- **Technical**: 
  - Use `pptxgenjs` or similar library to extract slide data
  - Send structure to Gemini for analysis
  - AI identifies: modules, learning objectives, content types (theory/exercise/quiz)
- **Output**: Structured analysis JSON
- **Effort**: 6-8 hours

#### 3.5.2 "Create from Upload" Flow (Days 2-3)
- **Task**: New UI flow on Dashboard
- **Steps**:
  1. User clicks "Create Course from Existing Material"
  2. Upload file → AI analyzes → Shows preview
  3. User selects environment (Live/Online)
  4. AI generates Blueprint based on uploaded content
  5. User reviews → Approves
  6. AI generates complete course
- **Effort**: 8-10 hours

#### 3.5.3 Gap Filling Logic (Day 3)
- **Task**: AI identifies missing content and generates it
- **Examples**:
  - No exercises? → Generate role-play scenarios
  - No assessments? → Create quiz from content
  - No trainer notes? → Add facilitation guidance
  - Converting to Online? → Transform slides into video scripts
- **Technical**: New Edge Function action `fill_gaps`
- **Effort**: 6-8 hours

#### 3.5.4 Dual Environment Support (Day 4)
- **Task**: Ensure generated content respects `environment`
- **Live Workshop Output**:
  - Trainer Guide with facilitation notes
  - Participant Workbook
  - Hands-on exercises
  - Timing recommendations
- **Online Course Output**:
  - Video scripts (based on slides + notes)
  - Interactive quizzes
  - Reading materials
  - Downloadable resources
- **Effort**: 4-6 hours

**Total Effort**: 24-32 hours (4 days)
**Risk**: Medium (PPTX parsing complexity)
**Priority**: High (killer feature)

---

## Phase 3: Deep Import & Knowledge Base (Week 3)

**Goal**: Allow users to upload materials and use them to influence content at any stage (enhances Phase 3.5).

**Dependencies**: Phase 3.5 (this is an enhancement of the upload feature).

### Implementation

#### 3.1 File Storage (Day 1)
- **Task**: Add `course_files` table
  ```sql
  CREATE TABLE course_files (
    id UUID PRIMARY KEY,
    course_id UUID REFERENCES courses(id),
    filename TEXT,
    storage_path TEXT,
    uploaded_at TIMESTAMP,
    file_type TEXT,
    extracted_text TEXT
  );
  ```
- **Effort**: 3-4 hours

#### 3.2 File Analysis (Day 1)
- **Task**: Extract text from uploaded files and store in `extracted_text` column
- **Technical**: Use existing PDF/DOCX parsing logic
- **Effort**: 2-3 hours

#### 3.3 "Refine with File" Action (Day 2)
- **Task**: Add new action `refine_with_file` to Edge Function
- **Input**: `selectedText` + `fileId` + `instruction`
- **AI Prompt**: "Use the content from [File] to improve this section..."
- **Effort**: 4-6 hours

**Total Effort**: 9-13 hours
**Risk**: Medium

---

## Phase 4: Quality Inspector (Week 4)

**Goal**: AI analyzes generated content and suggests improvements.

**Dependencies**: Phases 2 & 3.5 (needs content to analyze).

### Implementation

#### 4.1 Content Analysis (Days 1-2)
- **Task**: Add `analyze_quality` action to Edge Function
- **Input**: Full step content + course metadata
- **Output**: Array of suggestions:
  ```json
  [
    {
      "type": "warning",
      "message": "This exercise is too theoretical",
      "section": "Exercise 2",
      "suggestion": "Add a real-world scenario"
    }
  ]
  ```
- **Effort**: 6-8 hours

#### 4.2 UI for Suggestions (Days 2-3)
- **Task**: Show suggestions in sidebar
- **UX**: Click suggestion → jumps to section + highlights it
- **Effort**: 4-6 hours

**Total Effort**: 10-14 hours
**Risk**: Low (read-only operation)

---

## Technical Debt to Address (Week 3, Days 3-4)

### 1. Add `content_type` to `course_steps`
**Problem**: Currently using i18n keys to determine step type.
**Solution**: Add `content_type ENUM('slides', 'video_script', 'exercise', 'reading', 'quiz')`.
**Impact**: Enables programmatic filtering.
**Effort**: 2-3 hours

### 2. Add `module_id` and `section_id` to `course_steps`
**Problem**: Steps are flat list, lose hierarchical structure.
**Solution**: Add foreign keys to track which module/section each step belongs to.
**Impact**: Enables "regenerate Module 2".
**Effort**: 3-4 hours

---

## Dependency Chain & Risk Assessment

```
Phase 1.1 (Foundation) ← START HERE
    ↓ (blocks all content generation)
Phase 2 (Enables Co-Pilot)
    ↓ (needed to refine uploaded content)
Phase 3.5 (Upload & Transform)
    ↓ (enhances upload feature)
Phase 3 (Knowledge Base)
    ↓ (needs content to inspect)
Phase 4 (Quality Inspector)
```

| Phase | Technical Risk | Dependency Risk | Breaking Changes | Must Complete Before |
|-------|----------------|-----------------|------------------|----------------------|
| **1.1** | Low | **None** | None | Phase 2, 3.5 |
| **2** | Medium | Low | None | Phase 3.5 |
| **3.5** | Medium | Medium | None | Phase 3 |
| **3** | Medium | Low | None | Phase 4 |
| **4** | Low | High | None | - |

---

## Optimized Roadmap

### Week 1: Foundation & Co-Pilot
- **Day 1 (2 hours)**: Phase 1.1 - Audit Live vs Online logic
- **Days 2-5 (9-14 hours)**: Phase 2 - Patch-Based Editor
  - Day 2: Capture selection + start Edge Function
  - Day 3: Complete Edge Function + apply patch
  - Days 4-5: UI updates + testing

### Week 2: Killer Feature
- **Days 1-4 (24-32 hours)**: Phase 3.5 - Reverse Engineering
  - Days 1-2: File analysis + UI flow
  - Day 3: Gap filling logic
  - Day 4: Dual environment support
- **Day 5**: Testing with real presentations

### Week 3: Enhancement & Cleanup
- **Days 1-2 (9-13 hours)**: Phase 3 - Knowledge Base
- **Days 3-4 (5-7 hours)**: Technical Debt (content_type, module_id)
- **Day 5**: Integration testing

### Week 4: Polish
- **Days 1-3 (10-14 hours)**: Phase 4 - Quality Inspector
- **Days 4-5**: Final testing, bug fixes, documentation

---

## Success Metrics

1. **Correctness**: 100% of Live courses generate Trainer Notes (not Video Scripts)
2. **Edit Ratio**: Manual edits vs AI generations (should increase with patch-based editing)
3. **Upload Adoption**: % of courses created from uploaded materials
4. **Quality Score**: Average suggestions per course (from Quality Inspector)
5. **User Retention**: % of users who return after first course creation

---

## Critical Success Factors

1. **Phase 1.1 MUST be done first** - it's the foundation
2. **Phase 2 unlocks the co-pilot experience** - high priority
3. **Phase 3.5 is the competitive advantage** - but needs Phase 2
4. **Don't skip Technical Debt** - it enables future features

---

## Open Questions

1. Should we add versioning (undo/redo for AI changes)?
2. Do we need real-time collaboration (multiple users editing same course)?
3. Should we support batch operations (e.g., "simplify all exercises")?
