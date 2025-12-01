Implementation Plan: Content Quality Improvements
Executive Summary
This plan addresses the critical content quality issues identified in the generated course materials. The root cause is duration hallucination (AI generating 20h courses instead of 4h), leading to token limit truncation and incomplete content.

Primary Solution: Option 2.5 - Auto-calculate duration (4-6h) with user override (2-8h max).

Problem Statement
Current Issues:
❌ Only 40% Complete - All 5 livrables stop after Module 2 (out of 5)
❌ Duration Hallucination - AI generates 20h courses when blueprint says 4h
❌ Token Limit Truncation - Trying to fit 20h into 8K token limit
❌ Inconsistent Quality - Some modules detailed, others missing
❌ Wrong Consolidation - Participant Manual merges incompatible content
Root Cause:
AI is not respecting the blueprint's estimated_duration, causing it to generate 5x more content than requested, hitting token limits, and failing to complete.

Proposed Solution: Option 2.5 (Hybrid Duration Control)
Strategy:
Don't ask users for duration (frictionless UX like Coursebox.ai)
AI auto-calculates optimal duration (4-6h based on complexity)
Users can override in Blueprint Review (2-8h slider)
Hard cap at 8 hours (cost control)
Benefits:
✅ Frictionless onboarding (no extra question) ✅ Predictable costs (8h max = ~$0.50-1.00/course) ✅ Complete content (4-6h fits in token limits) ✅ User control (can adjust if needed) ✅ Better than competitors (transparent + adjustable)

Implementation Phases
Phase 1: Duration Control (Week 1) - CRITICAL
1.1 Remove Duration Question from AI Chat
File: 
supabase/functions/generate-course-content/index.ts
 Location: Lines 224-230 (chat_onboarding prompt)

Change:

// BEFORE:
**INSTRUCTIONS:**
1. **Analyze** the conversation so far.
2. **Determine** if you have enough information. Key info needed:
    - Specific Learning Objectives
    - Target Audience details
    - Desired Duration (e.g., 1 day, 4 weeks, 2 hours)  // ❌ REMOVE THIS
    - Depth/Tone preference
// AFTER:
**INSTRUCTIONS:**
1. **Analyze** the conversation so far.
2. **Determine** if you have enough information. Key info needed:
    - Specific Learning Objectives
    - Target Audience details
    - Depth/Tone preference (beginner, intermediate, advanced)
3. **Auto-Calculate Duration** based on topic complexity:
    - Simple topic (1-2 key concepts): "2-3 hours"
    - Moderate topic (3-5 key concepts): "4-5 hours"
    - Complex topic (6+ key concepts): "6-8 hours"
    - NEVER exceed "8 hours"
Complexity: 2/10 Impact: HIGH - Eliminates duration hallucination

1.2 Add Duration Calculation Logic
File: 
supabase/functions/generate-course-content/index.ts
 Location: Lines 240-270 (blueprint generation section)

Add:

// After generating blueprint, calculate duration
const calculateOptimalDuration = (modules: CourseModule[]): string => {
  const totalSections = modules.reduce((sum, m) => sum + m.sections.length, 0);
  
  if (totalSections <= 6) return "2 hours";
  if (totalSections <= 12) return "4 hours";
  if (totalSections <= 18) return "6 hours";
  return "8 hours"; // Cap at 8 hours
};
// In blueprint generation:
"estimated_duration": "${calculateOptimalDuration(modules)}",
Complexity: 3/10 Impact: HIGH - Ensures realistic durations

1.3 Enforce Duration in All 12 Step Prompts
File: 
supabase/functions/generate-course-content/index.ts
 Location: Lines 336-476 (all 12 step prompts)

Change: Add to EVERY step prompt:

const blueprintDuration = blueprint?.estimated_duration || "4 hours";
specificPrompt = `
  **ROLE**: You are a World-Class Instructional Designer.
  **CONTEXT**: Creating a **${course.environment}** course titled "**${course.title}**".
  **TOTAL DURATION**: ${blueprintDuration} (STRICT LIMIT - DO NOT EXCEED)
  
  **CRITICAL**: The ENTIRE course must fit within ${blueprintDuration}. 
  Allocate time proportionally across all modules.
  
  ${specificPrompt}
`;
Files to Update:

Line 337: performance_objectives
Line 347: course_objectives
Line 356: structure ← MOST CRITICAL
Line 366: learning_methods
Line 376: timing_and_flow
Line 386: exercises
Line 398: examples_and_stories
Line 408: facilitator_notes
Line 418: slides
Line 428: facilitator_manual
Line 437: participant_workbook
Line 446: video_scripts
Complexity: 5/10 (repetitive but straightforward) Impact: CRITICAL - Prevents duration hallucination

1.4 Add Duration Slider to Blueprint Review UI
File: 
src/components/OnboardingChat.tsx
 (or wherever Blueprint Review is rendered) Location: After blueprint display, before "Continue to Blueprint" button

Add:

{blueprint && (
  <div className="blueprint-review">
    {/* Existing blueprint display */}
    
    {/* NEW: Duration Control */}
    <div className="duration-control mt-4 p-4 bg-gray-800 rounded">
      <label className="block text-sm font-medium mb-2">
        Course Duration
      </label>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min="2"
          max="8"
          step="1"
          value={parseInt(blueprint.estimated_duration)}
          onChange={(e) => {
            const newDuration = `${e.target.value} hours`;
            updateBlueprint({ ...blueprint, estimated_duration: newDuration });
          }}
          className="flex-1"
        />
        <span className="text-lg font-bold">{blueprint.estimated_duration}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Adjust if needed (2-8 hours maximum for optimal quality)
      </p>
    </div>
  </div>
)}
Complexity: 4/10 Impact: MEDIUM - Gives users control

Phase 2: Fix Consolidation Mapping (Week 1)
2.1 Separate Incompatible Content Types
File: 
src/components/GenerationProgressModal.tsx
 Location: Lines 75-90 (LIVRABLE_MAPPING)

Change:

// BEFORE (6 livrables):
const LIVRABLE_MAPPING = [
  {
    key: 'course.livrables.structure',
    sources: [TrainerStepType.Structure, TrainerStepType.TimingAndFlow]
  },
  {
    key: 'course.livrables.participant_manual',  // ❌ WRONG - merges 2 types
    sources: [
      TrainerStepType.ExamplesAndStories,
      TrainerStepType.ParticipantWorkbook
    ]
  },
  // ... 4 more
];
// AFTER (8 livrables):
const LIVRABLE_MAPPING = [
  {
    key: 'course.livrables.structure',
    label: 'Complete Structure',
    sources: [TrainerStepType.Structure, TrainerStepType.TimingAndFlow]
  },
  {
    key: 'course.livrables.examples',  // ✅ SEPARATE
    label: 'Examples & Case Studies',
    sources: [TrainerStepType.ExamplesAndStories]
  },
  {
    key: 'course.livrables.participant_workbook',  // ✅ SEPARATE
    label: 'Participant Workbook',
    sources: [TrainerStepType.ParticipantWorkbook]
  },
  {
    key: 'course.livrables.trainer_manual',
    label: 'Trainer Manual',
    sources: [TrainerStepType.FacilitatorNotes, TrainerStepType.FacilitatorManual]
  },
  {
    key: 'course.livrables.exercises',
    label: 'Exercises & Activities',
    sources: [TrainerStepType.Exercises]
  },
  {
    key: 'course.livrables.slides',
    label: 'Slide Deck',
    sources: [TrainerStepType.Slides]
  },
  {
    key: 'course.livrables.video_scripts',
    label: 'Video Scripts',
    sources: [TrainerStepType.VideoScripts]
  },
  {
    key: 'course.livrables.assessment',
    label: 'Assessment & Tests',
    sources: [TrainerStepType.Tests]
  }
];
Complexity: 3/10 Impact: MEDIUM - Cleaner output structure

2.2 Add Translation Keys for New Livrables
Files:

public/locales/en.json
public/locales/ro.json
Add:

{
  "course": {
    "livrables": {
      "examples": "Examples & Case Studies",
      "video_scripts": "Video Scripts",
      "assessment": "Assessment & Tests"
    }
  }
}
Complexity: 1/10 Impact: LOW - UI labels

Phase 3: Add Quality Enforcement (Week 2)
3.1 Add Minimum Content Requirements to Prompts
File: 
supabase/functions/generate-course-content/index.ts
 Location: Each step prompt

Example (for exercises step):

case 'exercises':
  const moduleCount = blueprint?.modules?.length || 4;
  specificPrompt = `
    **TASK**: Design Practical Exercises (Deep Content).
    **REQUIREMENTS**:
    - Generate 2-3 exercises PER MODULE (Total: ${moduleCount * 2} exercises minimum)
    - Each exercise MUST include:
      1. **Purpose**: Why are we doing this?
      2. **Instructions**: 5-7 step-by-step guide
      3. **Materials**: What is needed?
      4. **Time**: How long (in minutes)?
      5. **Debrief**: 3-5 questions for facilitator
    - Vary exercise types: Role Play, Case Study, Simulation, Reflection, Group Activity
    - DO NOT leave any module without exercises
  `;
Apply to:

exercises: 2-3 per module
slides: 15-20 per module
examples_and_stories: 3-5 per module
video_scripts: 1 per lesson
Complexity: 6/10 Impact: HIGH - Ensures completeness

3.2 Add Post-Generation Validation
File: 
src/components/GenerationProgressModal.tsx
 Location: In 
finalizeGeneration()
 function, before consolidation

Add:

const validateContent = (accumulatedContent: any[], blueprint: CourseBlueprint) => {
  const issues: string[] = [];
  
  // Check if all modules are covered
  for (const module of blueprint.modules) {
    const structureContent = accumulatedContent.find(s => s.step_type === 'structure')?.content || '';
    if (!structureContent.includes(module.title)) {
      issues.push(`Missing content for module: ${module.title}`);
    }
  }
  
  // Check minimum word counts
  const MIN_WORDS = {
    structure: 1500,
    exercises: 1000,
    participant_workbook: 2000,
    slides: 500,
    facilitator_manual: 2500
  };
  
  for (const item of accumulatedContent) {
    const wordCount = item.content.split(/\s+/).length;
    const minWords = MIN_WORDS[item.step_type as keyof typeof MIN_WORDS];
    if (minWords && wordCount < minWords) {
      issues.push(`${item.step_type} is too short: ${wordCount} words (minimum: ${minWords})`);
    }
  }
  
  return issues;
};
// In finalizeGeneration:
const validationIssues = validateContent(accumulatedContentRef.current, course.blueprint);
if (validationIssues.length > 0) {
  console.warn('Content quality issues:', validationIssues);
  // Optionally: Show warning to user or trigger regeneration
}
Complexity: 5/10 Impact: MEDIUM - Catches quality issues

Phase 4: Improve Prompt Quality (Week 3)
4.1 Add Industry-Specific Context
File: 
supabase/functions/generate-course-content/index.ts
 Location: All step prompts

Add:

const getAudienceContext = (targetAudience: string): string => {
  if (targetAudience.toLowerCase().includes('corporate') || targetAudience.toLowerCase().includes('professional')) {
    return `
      **AUDIENCE CONTEXT**: Corporate professionals
      - Use workplace scenarios (meetings, projects, team dynamics)
      - Reference business metrics and KPIs
      - Include examples from management, sales, HR contexts
    `;
  }
  if (targetAudience.toLowerCase().includes('student') || targetAudience.toLowerCase().includes('academic')) {
    return `
      **AUDIENCE CONTEXT**: Students/Academic
      - Use classroom and campus scenarios
      - Reference exams, assignments, group projects
      - Include examples from study groups, presentations
    `;
  }
  return `
    **AUDIENCE CONTEXT**: General public
    - Use everyday life scenarios (family, friends, community)
    - Reference common situations (shopping, social events, hobbies)
    - Include relatable examples from daily interactions
  `;
};
// Add to all prompts:
${getAudienceContext(course.target_audience)}
Complexity: 4/10 Impact: HIGH - Makes content more relevant

4.2 Add Variety Instructions
File: 
supabase/functions/generate-course-content/index.ts
 Location: exercises, examples_and_stories prompts

Add:

**VARIETY REQUIREMENTS**:
- DO NOT repeat the same format for every item
- Alternate between different types:
  * Exercises: Role Play → Case Study → Simulation → Reflection → Group Activity
  * Examples: Analogy → Real Story → Hypothetical Scenario → Historical Case → Personal Anecdote
- Increase complexity gradually (simple → intermediate → advanced)
Complexity: 3/10 Impact: MEDIUM - Prevents monotony

Verification Plan
Automated Checks
Duration Validation:

Create test course with "Simple topic" → Verify duration = 2-3h
Create test course with "Complex topic" → Verify duration = 6-8h
Manually set duration to 10h → Verify capped at 8h
Content Completeness:

Generate course with 4 modules → Verify all 4 modules present in all livrables
Check word counts → Verify meet minimums
Manual Verification
Full Flow Test:

Create "Assertiveness" course (OnlineCourse, 4 hours)
Verify Blueprint shows "4 hours"
Adjust slider to 6 hours
Generate Materials
Verify:
All 8 livrables generated
All modules covered (no "Va fi detaliat" notes)
Content quality is high
Duration matches (6 hours total)
Edge Cases:

Test with 2-hour course (minimal)
Test with 8-hour course (maximum)
Test with very simple topic (1 module)
Test with complex topic (6 modules)
Success Metrics
Before Implementation:
❌ Coverage: 40% (2 of 5 modules)
❌ Duration Accuracy: 0% (20h instead of 4h)
❌ Completeness: 6 livrables, all incomplete
❌ Quality: Shallow, repetitive
After Phase 1:
✅ Coverage: 100% (all modules)
✅ Duration Accuracy: 100% (respects blueprint)
✅ Completeness: 8 livrables, all complete
⏳ Quality: Medium (complete but basic)
After Phase 2-4:
✅ Coverage: 100%
✅ Duration Accuracy: 100%
✅ Completeness: 100%
✅ Quality: HIGH (rich, varied, industry-specific)
Priority Roadmap
Week 1 (CRITICAL)
 1.1 Remove duration question from AI chat
 1.2 Add duration calculation logic
 1.3 Enforce duration in all 12 step prompts
 1.4 Add duration slider to Blueprint Review
 2.1 Fix consolidation mapping (8 livrables)
 2.2 Add translation keys
Week 2
 3.1 Add minimum content requirements to prompts
 3.2 Add post-generation validation
Week 3
 4.1 Add industry-specific context
 4.2 Add variety instructions
Cost Analysis
Current State:
20h course attempt → ~15,000 tokens → Truncated → $0.20 wasted
After Fix:
4h course → ~8,000 tokens → Complete → $0.10 per course
8h course (max) → ~15,000 tokens → Complete → $0.20 per course
Savings: 50% cost reduction + 100% completion rate

Risks & Mitigation
Risk 1: Users want >8h courses
Mitigation:

Show message: "For courses longer than 8 hours, we recommend creating multiple courses or modules."
Offer "Part 1" and "Part 2" workflow
Risk 2: 8h still hits token limits
Mitigation:

Implement chunked generation (generate 1 module at a time)
Add "CONTINUE" logic for truncated responses
Risk 3: Quality still low
Mitigation:

Phase 3-4 improvements (variety, industry context)
User feedback loop for prompt refinement
Next Steps
Review this plan with stakeholders
Prioritize Phase 1 (Week 1) - most critical
Deploy to staging after Phase 1
Test thoroughly before production
Monitor metrics (completion rate, user satisfaction)
Iterate based on feedback
