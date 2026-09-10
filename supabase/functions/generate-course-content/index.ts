// ==========================================
// GENERATED BUNDLE: generate-course-content
// VERSION: v4.0.0-CLAUDE
// ARCHITECTURE: Class-based, Claude (Anthropic) as sole LLM provider
// ==========================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Anthropic from "npm:@anthropic-ai/sdk";
// --------------------------------------------------------------------------------
// INLINED MODULE: Style Blocks
// --------------------------------------------------------------------------------
enum AudienceLevel {
  LEVEL_1_OPERATIONAL = 'LEVEL_1_OPERATIONAL',
  LEVEL_2_CLERICAL = 'LEVEL_2_CLERICAL',
  LEVEL_3_STRATEGIC = 'LEVEL_3_STRATEGIC',
  LEVEL_4_COMMERCIAL = 'LEVEL_4_COMMERCIAL',
  LEVEL_5_TECHNICAL = 'LEVEL_5_TECHNICAL'
}

const STYLE_BLOCKS = {
  [AudienceLevel.LEVEL_1_OPERATIONAL]: `
### 🧬 AUDIENCE DNA: LEVEL 1 (OPERATIONAL / FRONT LINE)
**PRIMARY GOAL:** Practical Execution, Safety & Consistency.
**BLOOM LEVEL:** Understand & Apply (Troubleshoot).

**STRICT STYLE RULES:**
1.  **TONE:** Respectful, Direct, Peer-to-Peer. Avoid "school teacher" tone.
2.  **SENTENCE STRUCTURE:** Concise. Action-First. (e.g., "Press X to start", not "To start, X should be pressed").
3.  **VOCABULARY:**
    - ✅ USE: Industry-standard terms, "Verify", "Calibrate", "Result", "Check", "Stop", "Report".
    - ❌ FORBIDDEN: Corporate jargon ("Synergy"), Academic fluff, "Paradigm".
4.  **EXAMPLES:** Real-world scenarios ("When the warning light blinks...", "When the machine stops...").
5.  **FORMATTING:** Checklists, Troubleshooting Tables, bold warnings.
`,

  [AudienceLevel.LEVEL_2_CLERICAL]: `
### 🧬 AUDIENCE DNA: LEVEL 2 (CLERICAL / JUNIOR MANAGEMENT)
**PRIMARY GOAL:** Process Efficiency, Accuracy & Coordination.
**BLOOM LEVEL:** Apply & Analyze.

**STRICT STYLE RULES:**
1.  **TONE:** Professional, Collaborative, Structured.
2.  **SENTENCE STRUCTURE:** Clear cause-and-effect ("If X happens, then do Y").
3.  **VOCABULARY:** Standard business terminology.
    - ✅ USE: "Workflow", "Compliance", "Stakeholder", "Optimization".
    - ❌ FORBIDDEN: Overly casual slang or overly dense academic theory.
4.  **EXAMPLES:** Case studies, Email templates, Process maps.
5.  **FORMATTING:** Step-by-step guides, Decision trees.
`,

  [AudienceLevel.LEVEL_3_STRATEGIC]: `
### 🧬 AUDIENCE DNA: LEVEL 3 (STRATEGIC / SENIOR LEADERSHIP)
**PRIMARY GOAL:** Vision, ROI, Culture & Change Management.
**BLOOM LEVEL:** Evaluate & Create.

**STRICT STYLE RULES:**
1.  **TONE:** Executive, Insightful, "Boardroom Ready".
2.  **SENTENCE STRUCTURE:** Sophisticated but high-impact. Focus on "Why" over "How".
3.  **VOCABULARY:** Strategic drivers.
    - ✅ USE: "Scalability", "Market positioning", "Risk mitigation", "Capital allocation".
    - ❌ FORBIDDEN: Getting bogged down in low-level tactical details.
4.  **EXAMPLES:** Industry trends, Competitive analysis, high-stakes dilemmas.
5.  **FORMATTING:** Executive summaries, key strategic pillars, data visualization concepts.
`,

  [AudienceLevel.LEVEL_4_COMMERCIAL]: `
### 🧬 AUDIENCE DNA: LEVEL 4 (SALES / CUSTOMER SUCCESS)
**PRIMARY GOAL:** Persuasion, Relationship Building & Revenue.
**BLOOM LEVEL:** Apply, Analyze & Create (Social Dynamics).

**STRICT STYLE RULES:**
1.  **TONE:** High-Energy, Empathetic, Persuasive, Confident.
2.  **SENTENCE STRUCTURE:** Conversational, engaging, question-heavy.
3.  **VOCABULARY:** Emotional intelligence & Sales.
    - ✅ USE: "Rapport", "Discovery", "Pain point", "Value proposition", "Closing".
    - ❌ FORBIDDEN: Dry technical specs, passive voice, bureaucratic language.
4.  **EXAMPLES:** Roleplay scripts, Objection handling, "What to say when...".
5.  **FORMATTING:** Scripts, Dialogue blocks, "Do's and Don'ts".
`,

  [AudienceLevel.LEVEL_5_TECHNICAL]: `
### 🧬 AUDIENCE DNA: LEVEL 5 (TECHNICAL EXPERT / R&D)
**PRIMARY GOAL:** Deep Understanding, Innovation & Problem Solving.
**BLOOM LEVEL:** Analyze, Evaluate & Create (Systemic).

**STRICT STYLE RULES:**
1.  **TONE:** Precise, Geeky (in a good way), Detail-Oriented.
2.  **SENTENCE STRUCTURE:** Can handle complexity. Precision is key.
3.  **VOCABULARY:** Domain-specific technical terminology.
    - ✅ USE: Correct technical acronyms, specific metrics, system logic.
    - ❌ FORBIDDEN: Simplifying things "for the layman". Dumbed-down analogies.
4.  **EXAMPLES:** Code snippets, Schematics, Edge cases, Debugging logs.
5.  **FORMATTING:** Code blocks, Technical diagrams, Data tables.
`
};

function normalizeAudienceText(text: string): string {
  const lower = (text || '').toLowerCase();
  return lower
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ş/g, 's')
    .replace(/ț/g, 't')
    .replace(/ţ/g, 't');
}

function getStyleBlock(audienceDescription: string): string {
  const normalized = normalizeAudienceText(audienceDescription);

  const opKeywords = [
    'blue collar', 'line worker', 'frontline', 'front line',
    'operator', 'factory', 'warehouse', 'depozit', 'magazie',
    'muncitor', 'muncitori', 'productie', 'linie de productie',
    'sofer', 'driver', 'assembly', 'maintenance', 'field technician'
  ];

  const clericalKeywords = [
    'office', 'back office', 'clerical', 'administrative',
    'junior', 'assistant', 'coordinator', 'front desk',
    'operator call center', 'data entry'
  ];

  const strategicKeywords = [
    'executive', 'executives', 'director', 'vp', 'c-level', 'c level',
    'ceo', 'cfo', 'coo', 'board', 'board member',
    'senior leadership', 'top management', 'strategic',
    'founder', 'owner'
  ];

  const commercialKeywords = [
    'sales', 'sales team', 'account manager', 'account management',
    'customer success', 'customer support', 'customer service',
    'client service', 'call center', 'contact center',
    'agent vanzari', 'vanzari', 'relatii cu clientii'
  ];

  const technicalKeywords = [
    'developer', 'software engineer', 'programmer',
    'programator', 'inginer', 'engineer', 'architect',
    'it', 'it pro', 'devops', 'sysadmin', 'data scientist',
    'technical staff', 'r&d', 'research and development'
  ];

  let scoreOperational = 0;
  let scoreClerical = 0;
  let scoreStrategic = 0;
  let scoreCommercial = 0;
  let scoreTechnical = 0;

  const addScore = (keywords: string[], increment: () => void) => {
    for (const kw of keywords) {
      if (!kw) continue;
      if (normalized.includes(kw)) {
        increment();
      }
    }
  };

  addScore(opKeywords, () => { scoreOperational += 2; });
  addScore(clericalKeywords, () => { scoreClerical += 2; });
  addScore(strategicKeywords, () => { scoreStrategic += 2; });
  addScore(commercialKeywords, () => { scoreCommercial += 2; });
  addScore(technicalKeywords, () => { scoreTechnical += 2; });

  if (scoreOperational === 0 && scoreClerical === 0 && scoreStrategic === 0 && scoreCommercial === 0 && scoreTechnical === 0) {
    return STYLE_BLOCKS[AudienceLevel.LEVEL_2_CLERICAL];
  }

  let bestLevel = AudienceLevel.LEVEL_2_CLERICAL;
  let bestScore = scoreClerical;

  const consider = (level: AudienceLevel, score: number, priorityBoost = 0) => {
    const effectiveScore = score + priorityBoost;
    if (effectiveScore > bestScore) {
      bestScore = effectiveScore;
      bestLevel = level;
    }
  };

  consider(AudienceLevel.LEVEL_1_OPERATIONAL, scoreOperational, 0.5);
  consider(AudienceLevel.LEVEL_3_STRATEGIC, scoreStrategic, 0.5);
  consider(AudienceLevel.LEVEL_4_COMMERCIAL, scoreCommercial, 0.25);
  consider(AudienceLevel.LEVEL_5_TECHNICAL, scoreTechnical, 0.5);

  return STYLE_BLOCKS[bestLevel];
}

// --------------------------------------------------------------------------------
// INLINED MODULE: Depth Specs (from templates.ts)
// --------------------------------------------------------------------------------
const getDepthSpecs = (language: string, type: 'live' | 'online' = 'live', practicePercent: number = 80) => {
  // PS-1: Universal Depth Specs with Dynamic Language Injection
  // PS-11: Environment Adaptation (Live vs Online)
  
  const envSpecs = type === 'online' 
    ? `
    **ENVIRONMENT: ONLINE (VIRTUAL CLASSROOM - ZOOM/TEAMS)**
    - **INTERACTION**: Must use "Breakout Rooms", "Chat Polls", "Miro Board links", "Screen Share".
    - **CONSTRAINTS**: Max 10 min monologues (Zoom Fatigue). Frequent "Type in chat" prompts.
    - **MATERIALS**: PDFs, Digital Workbooks, Online Quizzes.
    ` 
    : `
    **ENVIRONMENT: LIVE (IN-PERSON WORKSHOP)**
    - **INTERACTION**: EXCLUSIVE face-to-face activities: "Turn to your neighbor", "Physical Flipcharts", "Room Movement", "Gallery Walk", "Role Play in room", "Group Discussions", "Physical Exercises".
    - **CONSTRAINTS**: 
      *   Standard attention spans. Physical handouts allowed.
      *   **FORBIDDEN**: DO NOT mention videos, webinars, online dashboards, virtual forums, zoom links, or screen sharing.
    - **MATERIALS**: Printed Workbooks, Sticky Notes, Markers, Flipchart paper.
    `;

  return {
    workbook: `
    **DEPTH SPECIFICATIONS (Workbook):**
    - **LENGTH**: Comprehensive workbook (target 40+ pages).
    - **PEDAGOGY (ACTION-FIRST)**:
      *   **No Fluff**: Do not explain "definitions" unless critical. Go straight to "How to apply".
      *   **Step-by-Step**: Use numbered lists for actions. "Step 1: Do X. Step 2: Do Y."
      *   **Checklists**: Include "Am I doing it right?" checklists for every concept.
    - **CONTENT PER MODULE**:
      *   **Explanatory Text**: 800-1200 words. Conversational.
      *   **Stories**: Include at least 1-2 distinct stories/analogies per section (Hero -> Problem -> Solution).
      *   **Case Studies**: Full case studies (1 page each) with the Course Protagonist.
      *   **Exercises**: Every exercise must have: Objective, Instructions, Formatted answer space (tables/boxes).
    - **FORMATTING**: Markdown headers, Blockquotes for takeaways, Bold for emphasis.
      *   For any tabular content (timing breakdowns, comparisons, multi-column checklists), use standard GitHub-Flavored Markdown tables with a header row and separator row (| Col1 | Col2 | ... | / | --- | --- | ... |). Do NOT use HTML tables.
    - **LANGUAGE**: All content must be in **${language}**.
    ${envSpecs}
  `,
    slides: `
    **DEPTH SPECIFICATIONS (Slides):**
    - **QUANTITY**: 1 slide per 6-8 minutes.
    - **STORYTELLING FLOW**:
      *   Slide 1: The Hook (Problem/Story).
      *   Slide 2: The Solution (Concept).
      *   Slide 3: The Framework (Visual Model).
      *   Slide 4: Practical Application.
    - **VISUALS**: Describe specific imagery (e.g., "Photo of a frustrated manager looking at a clock").
    - **LANGUAGE**: All content must be in **${language}**.
    ${envSpecs}
  `,
    exercises: `
    **DEPTH SPECIFICATIONS (Exercises):**
    - **QUANTITY**: Ensure approximately **${practicePercent}%** of the course time is practical (based on User's Blueprint).
    - **REALITY CHECK**:
      *   **Scenario-Based**: Never ask "What is X?". Ask "Client Y is yelling. What do you say?".
      *   **Red Flags**: Always include "What could go wrong?" sections.
    - **DETAIL**:
      *   **Timing**: Specify exact duration.
      *   **Facilitator Instructions**: Step-by-step guide.
      *   **Debriefing**: 3-5 specific questions (Factual, Analytical, Applicative).
    - **TABULAR CONTENT**:
      *   When describing timing breakdowns, comparison grids (Before/After, Do/Don't), or observer checklists with more than one column, always format them as standard GitHub-Flavored Markdown tables (header row + separator row + data rows). Example pattern: \`| Time | Activity | Method |\\n| --- | --- | --- |\\n| 10 min | Warm-up | Pair discussion |\`.
      *   Do NOT use HTML \`<table>\` tags anywhere. Only Markdown tables.
    - **LANGUAGE**: All content must be in **${language}**.
    ${envSpecs}
  `,
    manual: `
    **DEPTH SPECIFICATIONS (Trainer Manual):**
    - **FLOW TABLE**: Minute-by-minute agenda written as a standard GitHub-Flavored Markdown table (header row, separator row, then one row per segment). Do NOT use HTML tables.
    - **SCRIPTS**: Full conversational scripts. NO "Say hello to participants". WRITE exactly what to say.
    - **STORYTELLING**: The trainer is a storyteller. Scripts must include personal anecdotes placeholders.
    - **METHODOLOGY**:
      *   **Feedback**: SBI Model only.
      *   **Problem Solving**: Ishikawa / 5 Whys.
    - **STRUCTURE**: ONE coherent manual.
    - **LANGUAGE**: All content must be in **${language}**.
    ${envSpecs}
  `
  };
};

// --------------------------------------------------------------------------------
// INLINED MODULE: Golden Samples (from golden-samples.ts)
// --------------------------------------------------------------------------------
const GOLDEN_SAMPLES = {
  objectives: `
# [Course Title]
**Total Duration:** [Hours]
**Target Audience:** [Specific Audience]
**Format:** [Live Workshop OR Online Course]

---

## 🎯 LEARNING OBJECTIVES (BLOOM'S TAXONOMY)

At the end of this course, participants will be able to:

### 1. **ANALYZE** (Bloom: Analyze)
To identify [Key Problem/Pattern] using [Specific Framework/Tool] and justify the diagnosis with concrete evidence from [Context].

**Success Criteria:**
- Correctly classifies [X]% of [Scenarios]
- Provides minimum [Y] evidence points for each classification

---

### 2. **APPLY** (Bloom: Apply)
To adapt [Method/Technique] depending on [Variable A] and [Variable B], using the [Step-by-Step Process] learned in Module [N].

**Success Criteria:**
- Solves correctly [X]/[Y] practical scenarios
- Develops an action plan for a real-world situation

---

### 3. **CREATE** (Bloom: Create)
To develop a personalized [Strategy/Plan/Project] for [Target], with specific milestones and [KPIs].

**Success Criteria:**
- The plan contains specific actions (not vague wishes)
- Includes [Specific Component A] and [Specific Component B]

---
`,

  workbook_online: `
## Module [N]: [Module Title]

### 1. Why this matters (The Hook)
[Compelling Intro]: Start with a relatable pain point or myth.
"Most people believe that [Common Myth about Topic]. But in reality, [Truth]."
"Have you ever felt [Pain Point]? You are not alone."

### 2. Core Concept: [Concept Name]
**Definition:** [Clear, jargon-free definition]

**The Framework ([Acronym/Model]):**
1. **[Step 1]:** [Explanation]
2. **[Step 2]:** [Explanation]
3. **[Step 3]:** [Explanation]

> **Pro Tip:** [Actionable insight or "Cheat Code"]

### 3. Real World Example (Narrative Arc)
**The Story of [Protagonist Name]:**
[Protagonist] faced [Challenge related to Module].
At first, they tried [Wrong Approach]. Result: [Negative Outcome].
Then, they applied [Core Concept].
**Result:** [Positive Outcome].

### 4. Practical Exercise [N].1
**Objective:** Apply [Concept] to a personal scenario.
**Instructions:**
1. Identify [X].
2. Apply [Y].
3. Write down [Z].

**Workspace:**
[____________________]
[____________________]
`,

  workbook_live: `
## Module [N]: [Module Title] (Live Workshop Edition)

### 1. Group Discussion Starter
**Question:** "[Provocative Question about Topic]?"
**Activity:** Turn to your neighbor (2 min) and discuss.

### 2. Core Framework: [Concept Name]
[Visual Diagram Placeholder]
- **[Component A]:** [Description]
- **[Component B]:** [Description]

### 3. The "Aha!" Moment
> **Key Takeaway:** [The most important insight of the module]

### 4. Group Activity [N].1: [Activity Name]
**Format:** Groups of [X]
**Time:** [Y] minutes
**Instructions:**
1. Select a [Role/Scenario].
2. Practice [Technique].
3. Debrief with the group.

**Debrief Questions:**
- What was difficult?
- What surprised you?
`,

  structure_online: `
# Detailed Structure: [Course Title] (Online)
**Total:** [X] hours video + [Y] hours study
**Format:** Self-paced Video Course

---

## 📚 Agenda Detaliată (Trainer Manual)

### Minute-by-minute Agenda
| Minut | Segment | Obiectiv Trainer | Activitatea Participanților |
|-------|---------|------------------|-----------------------------|
| 0-10  | Deschidere și context | Conectează tema cursului la realitatea participanților. | Răspund la întrebări scurte, împărtășesc situații proprii. |
| 10-25 | Explicarea conceptului cheie | Clarifică modelul/abordarea cu exemple concrete. | Notează idei-cheie, pune întrebări de clarificare. |
| 25-45 | Exercițiu aplicat | Dă instrucțiuni clare și observă dinamica. | Lucrează în grupuri/perechi la aplicația practică. |
| 45-55 | Debrief și consolidare | Ghidează discuția și extrage învățămintele principale. | Împărtășește insight-uri, formulează concluzii. |
| 55-60 | Wrap-up și următorii pași | Rezumă mesajele cheie și definește follow-up. | Notează angajamente personale și întrebări rămase. |

> Notă: Ajustează timpii în funcție de durata totală a modulului și de nivelul grupului.
`,

  slides_live: `
<SLIDE_BEGIN id="[N]">
<TITLE>[Engaging Question or Strong Statement?]</TITLE>
<!-- slide-layout: EXPLAINER -->
<VISUAL>[Description of visual: Diagram/Chart/Metaphor]</VISUAL>
<CONTENT>
- **[Key Point 1]:** [Brief explanation]
- **[Key Point 2]:** [Brief explanation]
- **[Key Point 3]:** [Brief explanation]
</CONTENT>
<NOTES>
**Hook:** Ask the audience: "[Question]?"
**Explanation:** Explain that [Concept] is not about [Misconception], but about [Truth].
**Story:** Share the story of [Protagonist] who [Scenario].
**Interaction:** Ask for a show of hands for [Condition].
</NOTES>
<SLIDE_END id="[N]">

<SLIDE_BEGIN id="[N+1]">
<TITLE>The [Framework Name] Framework</TITLE>
<!-- slide-layout: EXPLAINER -->
<VISUAL>[Step-by-step Process Diagram]</VISUAL>
<CONTENT>
- **Step 1:** [Action]
- **Step 2:** [Action]
- **Step 3:** [Action]
</CONTENT>
<NOTES>
Walk through each step.
Give a concrete example for Step 1.
Warn about the common pitfall in Step 2.
</NOTES>
<SLIDE_END id="[N+1]">
`,

  slides_online: `
<SLIDE_BEGIN id="[N]">
<TITLE>[Concept Name]</TITLE>
<!-- slide-layout: EXPLAINER -->
<VISUAL>[Clean, high-contrast visual for video overlay]</VISUAL>
<CONTENT>
- [Short bullet 1]
- [Short bullet 2]
</CONTENT>
<NOTES>
(Script is separate, these are visual cues)
Focus on [Key Term].
</NOTES>
<SLIDE_END id="[N]">
`,

  quiz: `
# FINAL ASSESSMENT: [Course Title]

## PART 1: KNOWLEDGE CHECK (Multiple Choice)

### ❓ QUESTION 1: [Concept A]
**Which of the following best describes [Concept A]?**

A) [Wrong Definition]
B) [Wrong Definition]
C) [Correct Definition] ✅
D) [Wrong Definition]

**Feedback if WRONG:**
"Remember, [Concept A] is about [Key Distinction]. Option [X] refers to [Concept B]."

---

## PART 2: SCENARIO APPLICATION

### ❓ QUESTION [N]: [Scenario Name]
**Scenario:** [Protagonist] is facing [Situation]. They decided to [Action].
**Question:** Was this the correct decision based on [Framework]?

A) Yes, because...
B) No, because [Reason 1] ✅
C) No, because [Reason 2]

**Justification:**
[Protagonist]'s situation required [Approach X], but they used [Approach Y].

---
`,

  video_script_online: `
# VIDEO SCRIPT: Module [N] - [Topic]
**Format:** Talking Head + B-Roll
**Duration:** 3-5 minutes
**Tone:** [Tone Adjectives: e.g., Professional, Encouraging, Direct]

---

**[SCENE 1: Talking Head - Hook]**
**(Visual: Instructor looking at camera)**

"Have you ever [Relatable Problem]?
You try to [Action], but [Obstacle] happens.
It's frustrating, right?

Today, I'm going to show you how to fix that using [Concept Name]."

---

**[SCENE 2: Concept Explanation]**
**(Visual: Animation of [Model/Framework])**

"The secret is [The Core Mechanism].
Most people think it's about [Misconception].
But actually, it's about [Truth].

Here are the 3 steps:
1. **[Step 1]**
2. **[Step 2]**
3. **[Step 3]**"

---

**[SCENE 3: Real World Example]**
**(Visual: B-Roll or Split Screen)**

"Let's look at an example.
Imagine [Scenario].
If you use [Old Way], [Bad Result] happens.
But if you use [Step 1] and [Step 2], look at the difference: [Good Result]."

---

**[SCENE 4: Call to Action]**
**(Visual: Instructor)**

"Now it's your turn.
Pause this video.
Go to your workbook and complete [Exercise Name].
Don't skip this. It's where the learning happens."
`,

  exercises_live: `
### Exercise: [Activity Name] ([Time] min)

**Format:** [Pairs/Groups/Individual]
**Objective:** Practice [Skill/Concept]

**Timing Breakdown:**
| Timp | Acțiune Facilitator | Acțiune Participant |
|------|---------------------|---------------------|
| 5 min | Prezintă scopul exercițiului și explică regulile. | Ascultă și pune întrebări de clarificare. |
| 10 min | Observă interacțiunile și notează comportamente-cheie. | Lucrează în perechi/grup la sarcina dată. |
| 5 min | Ghidează debrief-ul și extrage învățămintele principale. | Răspunde la întrebări și împărtășește observațiile. |

**Instrucțiuni detaliate:**
1. Formează grupuri de [X] persoane și atribuie roluri: [Role A], [Role B].
2. Explică sarcina: [Descriere scurtă a sarcinii].
3. Pornește cronometrul pentru fiecare etapă din tabel.
4. La final, facilitează discuția de debrief pe baza observațiilor.

**Observer Checklist:**
- [ ] Did they use [Technique 1]?
- [ ] Did they avoid [Pitfall]?
`,

  exercises_online: `
### Individual Exercise: [Name] ([Time] min)

**Format:** Individual Reflection
**Objective:** Analyze [Personal Situation] using [Framework].

**Instructions:**
1. **Identify** a recent situation where [Context].
2. **Apply** the [Method] to that situation.
3. **Complete** the table below.

**Template:**
| Situation | My Initial Reaction | Better Approach (using Method) |
|-----------|---------------------|--------------------------------|
| [Describe]| [Describe]          | [Describe]                     |
`,

  case_study: `
### Case Study: [Title]

**Background:**
[Company/Person Name] was facing [Critical Challenge].
They had tried [Previous Attempt], but it failed because [Reason].

**The Intervention:**
They decided to implement [Course Concept].
Specifically, they:
1. Changed [X] to [Y].
2. Adopted [Tool/Process].

**The Results:**
Within [Timeframe], they saw:
- [Metric 1] improved by [X]%.
- [Qualitative Result].

**Key Lesson:**
Success comes from [Core Principle], not just [Surface Level Action].
`
};

// ==========================================
// 1. INFRASTRUCTURE & CONFIGURATION
// ==========================================

class Config {
  static get SUPABASE_URL(): string {
    return Deno.env.get('SUPABASE_URL') || '';
  }

  static get SUPABASE_SERVICE_ROLE_KEY(): string {
    // Try legacy key first (still injected by Supabase for backward compat)
    const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (legacy) return legacy;
    // New JWT Signing Keys system: SUPABASE_SECRET_KEYS is a JSON dict
    const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS') || '';
    if (secretKeys) {
      try {
        const parsed = JSON.parse(secretKeys);
        return parsed.service_role || parsed.default || '';
      } catch { return ''; }
    }
    return '';
  }

  static get ANTHROPIC_API_KEY(): string | undefined {
    return this.sanitize(Deno.env.get('ANTHROPIC_API_KEY'));
  }

  // Only required for identity-linked (personal/service-account) API keys that
  // aren't scoped to a single workspace at creation time — see
  // https://platform.claude.com/docs/en/manage-claude/authentication#select-a-workspace.
  // Legacy "Workspace" keys (bound to one workspace by construction) never need this.
  // Defaults to the org's only workspace so this works without adding a new Supabase
  // secret; override via ANTHROPIC_WORKSPACE_ID if that ever changes.
  static get ANTHROPIC_WORKSPACE_ID(): string {
    return this.sanitize(Deno.env.get('ANTHROPIC_WORKSPACE_ID')) || 'wrkspc_01CfRoZ5D1KYnNSLd7i8C1Yz';
  }

  private static sanitize(key: string | undefined): string | undefined {
    if (!key) return undefined;
    return key.trim().replace(/^["']|["']$/g, '').replace(/^Bearer\s+/i, '');
  }
}

class Logger {
  private static VERSION = "v3.0-MODULAR";

  static info(message: string, context?: any) {
    console.log(`[${this.VERSION}] INFO: ${message}`, context ? JSON.stringify(context) : '');
  }

  static error(message: string, error?: any) {
    console.error(`[${this.VERSION}] ERROR: ${message}`, error);
  }

  static warn(message: string, context?: any) {
    console.warn(`[${this.VERSION}] WARN: ${message}`, context ? JSON.stringify(context) : '');
  }
}

// ==========================================
// 2. AI SERVICE LAYER (RESILIENT)
// ==========================================

interface IAIProvider {
  name: string;
  isConfigured(): boolean;
  generateContent(prompt: string): Promise<string>;
}

class ClaudeProvider implements IAIProvider {
  name = "Claude";

  isConfigured(): boolean {
    return !!Config.ANTHROPIC_API_KEY;
  }

  async generateContent(prompt: string): Promise<string> {
    const apiKey = Config.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Anthropic API Key missing");

    const model = "claude-sonnet-5";
    const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
    Logger.info(`Calling Claude API: model=${model} | Key: ${maskedKey}`);

    try {
      const client = new Anthropic({
        apiKey,
        defaultHeaders: { 'anthropic-workspace-id': Config.ANTHROPIC_WORKSPACE_ID }
      });
      const response = await client.messages.create({
        model,
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }]
      });

      // Capture usage immediately — the tokens are billed by Anthropic as soon as
      // the response comes back, regardless of whether our own text-extraction
      // check below finds usable content. Setting this after the check would
      // silently lose real spend whenever a response fails our validation.
      _lastCallUsage = {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        model
      };

      let text = "";
      for (const block of response.content) {
        if (block.type === "text") {
          text += block.text;
        }
      }

      if (!text) {
        throw new Error(`Invalid response from Claude (${model}): ${JSON.stringify(response)}`);
      }

      return text;
    } catch (e: any) {
      if (e instanceof Anthropic.AuthenticationError) {
        throw new Error(`Claude API Key invalid [Key: ${maskedKey}]`);
      }
      if (e instanceof Anthropic.RateLimitError) {
        throw new Error(`Claude Call Failed (${model}): rate limited [Key: ${maskedKey}]`);
      }
      if (e instanceof Anthropic.APIError) {
        throw new Error(`Claude API Error (${model}): ${e.message} [Key: ${maskedKey}]`);
      }
      throw new Error(`Claude Call Failed (${model}): ${e.message} [Key: ${maskedKey}]`);
    }
  }
}

class AIOrchestrator {
  private providers: IAIProvider[];

  constructor() {
    this.providers = [
      new ClaudeProvider()
    ];
  }

  async execute(prompt: string): Promise<string> {
    const errors: string[] = [];

    for (const provider of this.providers) {
      if (!provider.isConfigured()) {
        errors.push(`${provider.name}: Not configured`);
        continue;
      }

      try {
        return await provider.generateContent(prompt);
      } catch (error: any) {
        const errorMsg = `${provider.name} Error: ${error.message}`;
        Logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    throw new Error(`[v3.0-MODULAR] AI_ERROR: All providers failed. Details: ${JSON.stringify(errors)}`);
  }
}

// Global Orchestrator Instance
const orchestrator = new AIOrchestrator();

// ==========================================
// COST TRACKING
// ==========================================

// Module-level usage capture — populated by each provider after a successful call.
let _lastCallUsage = { inputTokens: 0, outputTokens: 0, model: 'unknown' };
// Set once per request from the auth header; read by callLLM for logging.
let _requestUserId = '';
let _requestAction = 'generate';
// Global retry budget for the CURRENT request (reset in the top-level `serve` handler).
// callLLM can be invoked many times while handling one action (module context,
// per-section content, etc.); without a cross-call cap, each of those calls could
// independently retry on a language-purity failure, compounding cost unboundedly
// across a single request. Once exhausted, callLLM returns best-effort instead of retrying.
let _retryBudget = 5;

// Cost in AI operations per action type — derived from actual frontend action names
const ACTION_OPERATION_COSTS: Record<string, number> = {
  // Actual action names sent by frontend (GenerationProgressModal, etc.)
  generate_workbook_part: 2,
  generate_manual_part: 2,
  generate_slides_part: 1,
  generate_exercises_part: 1,
  generate_examples_part: 1,
  generate_step_content: 1,
  generate_blueprint: 1,
  generate_learning_objectives: 1,
  generate_localized_labels: 1,
  backfill_key_takeaways: 1,
  // Legacy names (kept for backward compat)
  generate_workbook: 2,
  generate_manual: 2,
  generate_slides: 0,
  generate_exercises: 1,
  generate_module_context: 1,
};

async function logUsageFireAndForget(userId: string, inputTokens: number, outputTokens: number, model: string, action: string): Promise<void> {
  try {
    const supabaseUrl = Config.SUPABASE_URL;
    const serviceKey = Config.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !userId) {
      Logger.warn('[logUsage] Missing supabaseUrl or userId — skipping');
      return;
    }
    if (!serviceKey) {
      Logger.warn('[logUsage] SUPABASE_SERVICE_ROLE_KEY is empty — cannot write usage');
      return;
    }
    const client = createClient(supabaseUrl, serviceKey);
    const { error } = await client.from('user_usage').insert({
      user_id: userId,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      action,
    });
    if (error) {
      Logger.warn(`[logUsage] Insert failed: ${error.message} (code: ${error.code})`);
    } else {
      Logger.info(`[logUsage] Logged ${inputTokens}+${outputTokens} tokens for action=${action}`);
    }
  } catch (e) {
    Logger.warn(`[logUsage] Unexpected error: ${e}`);
  }
}

// ==========================================
// POST-PROCESSOR & VALIDATION
// ==========================================

const BANNED_PHRASES: Record<string, string[]> = {
  'ro': [
    'din păcate', 'din pacate', 'nu am suficient context', 'nu am suficiente informații',
    'sper că această propunere', 'sper ca aceasta propunere', 'vă rog să îmi oferiți',
    'va rog sa imi oferiti', 'acesta este un schelet general', 'dacă doriți să aprofundez',
    'daca doriti sa aprofundez', 'ca model de limbaj', 'ca un model de limbaj',
    'nu pot genera', 'nu pot crea',
    'sper că e util', 'sper sa fie util', 'dacă aveți nevoie', 'daca aveti nevoie',
    // English Artifacts (Strict Language Enforcement)
    'introduction', 'conclusion', 'key takeaways', 'trainer script', 'participant workbook',
    'learning objectives', 'module duration', 'materials needed', 'visual description'
  ],
  'en': [
    'i apologize', 'i do not have enough context', 'please provide more details',
    'this is a general outline', 'let me know if you need', 'as an ai language model',
    'unfortunately', 'i cannot generate', 'i cannot create', 'cannot fulfill'
  ],
  'fr': [
        'je m\'excuse', 'je n\'ai pas assez de contexte', 'veuillez fournir plus de détails',
        'ceci est un plan général', 'faites-moi savoir si vous avez besoin', 'en tant que modèle de langage',
        'malheureusement', 'je ne peux pas générer'
    ],
    'de': [
        'ich entschuldige mich', 'ich habe nicht genügend kontext', 'bitte geben sie weitere details an',
        'dies ist ein allgemeiner überblick', 'lassen sie mich wissen', 'als ki-sprachmodell',
        'leider', 'ich kann nicht generieren'
    ],
    'es': [
        'lo siento', 'no tengo suficiente contexto', 'por favor proporcione más detalles',
        'este es un esquema general', 'hágamelo saber si necesita', 'como modelo de lenguaje',
        'desafortunadamente', 'no puedo generar'
    ],
    'it': [
        'mi scuso', 'non ho abbastanza contesto', 'si prega di fornire maggiori dettagli',
        'questa è una bozza generale', 'fammi sapere se hai bisogno', 'come modello linguistico',
        'purtroppo', 'non posso generare'
    ]
};

// ============================================================
// DETERMINISTIC LANGUAGE DETECTOR (Phase 2 — replaces LLM Judge)
// Zero extra AI calls → eliminates 504 timeouts.
// Uses character-level frequency signatures for each language.
// Only triggers retry if >15% of sampled content words match
// wrong-language indicators.
// ============================================================

/**
 * Language signatures: arrays of highly-characteristic n-grams
 * that appear VERY frequently in a language but rarely in others.
 * These are based on common letter combinations, diacritics, and
 * function word fragments.
 *
 * For non-Latin-script languages, see NON_LATIN_SCRIPTS below which
 * uses Unicode range detection (more reliable than n-gram counting).
 */
const LANG_SIGNATURES: Record<string, string[]> = {
  ro: [
    'ș', 'ț', 'ă', 'â', 'î',
    'ul', 'ului', 'ilor', 'ând',
    ' și ', ' în ', ' cu ', ' de ',
    ' că ', ' la ', ' pe ', ' se ',
    'ează', 'esc', 'ești', 'ică',
    'pentru', 'care', 'este', 'sunt', 'prin',
  ],
  en: [
    ' the ', ' and ', ' of ', ' to ',
    ' in ', ' is ', ' it ', ' as ',
    ' that ', ' with ', ' this ', ' are ',
    ' for ', ' be ', ' was ', ' have ',
    "'s ", "'t ", "'re ", "n't ",
    'tion', 'ing ', 'ness', 'ment',
  ],
  fr: [
    ' le ', ' la ', ' les ', ' de ',
    ' et ', ' en ', ' est ', ' que ',
    ' des ', ' du ', ' une ', ' un ',
    'tion', 'eur', 'eux', 'ais', 'ait',
    'é', 'è', 'ê', 'à', 'ç', 'ù',
  ],
  de: [
    ' der ', ' die ', ' das ', ' und ',
    ' in ', ' ist ', ' mit ', ' des ',
    ' den ', ' dem ', ' von ', ' zu ',
    'ung', 'keit', 'heit', 'lich', 'sch',
    'ä', 'ö', 'ü', 'ß',
  ],
  es: [
    ' el ', ' la ', ' los ', ' de ',
    ' en ', ' es ', ' que ', ' se ',
    ' del ', ' las ', ' una ', ' con ',
    'ción', 'ando', 'iendo', 'mente',
    'á', 'é', 'í', 'ó', 'ú', 'ñ',
  ],
  it: [
    ' il ', ' la ', ' le ', ' di ',
    ' e ', ' in ', ' che ', ' per ',
    ' un ', ' una ', ' con ', ' del ',
    'zione', 'ità', 'mente', 'endo', 'ando',
    'à', 'è', 'é', 'ì', 'ò', 'ù',
  ],
  pt: [
    ' o ', ' a ', ' os ', ' de ',
    ' e ', ' em ', ' que ', ' do ',
    ' da ', ' um ', ' uma ', ' com ',
    'ção', 'ões', 'mente', 'ando', 'endo',
    'ã', 'õ', 'á', 'é', 'ê', 'ó', 'ú',
  ],
  nl: [
    ' de ', ' het ', ' een ', ' van ',
    ' in ', ' is ', ' en ', ' dat ',
    ' te ', ' op ', ' zijn ', ' met ',
    'ing', 'lijk', 'heid', 'tje', 'sch',
  ],
  pl: [
    ' i ', ' w ', ' się ', ' na ',
    ' z ', ' że ', ' to ', ' nie ',
    ' do ', ' go ', ' jak ', ' ale ',
    'ość', 'anie', 'enie', 'owy',
    'ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż',
  ],
};

/**
 * Non-Latin script detection via Unicode ranges.
 * For these languages, the presence of even a few script-specific
 * characters is definitive proof of the correct language — much
 * more reliable than n-gram counting.
 */
const NON_LATIN_SCRIPTS: Record<string, RegExp> = {
  ru: /[Ѐ-ӿ]/,
  uk: /[Ѐ-ӿ]/,
  bg: /[Ѐ-ӿ]/,
  sr: /[Ѐ-ӿ]/,
  ar: /[؀-ۿݐ-ݿ]/,
  he: /[֐-׿יִ-ﭏ]/,
  zh: /[一-鿿㐀-䶿]/,
  'zh-TW': /[一-鿿㐀-䶿]/,
  ja: /[぀-ゟ゠-ヿ一-鿿]/,
  ko: /[가-힯ᄀ-ᇿ]/,
  el: /[Ͱ-Ͽἀ-῿]/,
  hi: /[ऀ-ॿ]/,
  bn: /[ঀ-৿]/,
  th: /[฀-๿]/,
  ka: /[Ⴀ-ჿ]/,
  am: /[ሀ-፿]/,
  km: /[ក-៿]/,
  lo: /[຀-໿]/,
  my: /[က-႟]/,
  si: /[඀-෿]/,
  ta: /[஀-௿]/,
  te: /[ఀ-౿]/,
  kn: /[ಀ-೿]/,
  ml: /[ഀ-ൿ]/,
  gu: /[઀-૿]/,
  pa: /[਀-੿]/,
};

/**
 * Deterministically detect whether content is in the target language.
 * Strategy:
 * 1. Strip JSON keys, XML tags, and code (they're always English — not relevant).
 * 2. Extract text samples (start + mid + end, up to 3000 chars total).
 * 3. Count hits for targetLanguage vs hits for English (if target != en).
 * 4. If targetLanguage hits < 3 AND English hits > 5 → likely wrong language.
 * 5. Allow up to 15% foreign-language contamination (technical terms).
 *
 * Returns: { valid: boolean, reason?: string, confidence: number }
 */
function detectLanguageDeterministically(
  content: string,
  targetLanguage: string
): { valid: boolean; reason?: string; confidence: number } {

  // Skip check for short outputs — not enough signal (raw content < 400 chars)
  if (content.length < 400) return { valid: true, confidence: 1.0 };

  // Non-Latin script check: if the target has a known script, verify its presence
  const scriptRe = NON_LATIN_SCRIPTS[targetLanguage];
  if (scriptRe) {
    const hasScript = scriptRe.test(content);
    if (!hasScript) {
      return {
        valid: false,
        reason: `Expected ${targetLanguage} script characters but found none — content is likely in a different language.`,
        confidence: 0,
      };
    }
    return { valid: true, confidence: 0.9 };
  }

  // 1. Strip JSON keys ("key":), XML tags (<tag>), code blocks (```...```)
  const stripped = content
    .replace(/```[\s\S]*?```/g, '')         // remove code blocks
    .replace(/<[^>]+>/g, ' ')               // remove XML/HTML tags
    .replace(/"[a-zA-Z_]+"\s*:/g, ' ')     // remove JSON keys
    .replace(/\{|\}|\[|\]/g, ' ')          // remove JSON brackets
    .toLowerCase();

  // 2. Sample: start (1000) + mid (1000) + end (1000)
  const len = stripped.length;
  const mid = Math.floor(len / 2);
  const sample = [
    stripped.substring(0, Math.min(1000, len)),
    len > 2000 ? stripped.substring(mid - 500, mid + 500) : '',
    len > 1000 ? stripped.substring(Math.max(0, len - 1000)) : '',
  ].join(' ');

  if (sample.trim().length < 50) {
    // Not enough text to analyse — assume valid
    return { valid: true, confidence: 1.0 };
  }

  const targetSigs = LANG_SIGNATURES[targetLanguage] || [];
  const englishSigs = LANG_SIGNATURES['en'] || [];

  // Count signature hits
  const countHits = (sigs: string[]) =>
    sigs.reduce((acc, sig) => {
      // Count all occurrences of this signature
      let idx = 0; let count = 0;
      while ((idx = sample.indexOf(sig, idx)) !== -1) { count++; idx++; }
      return acc + count;
    }, 0);

  const targetHits = targetSigs.length > 0 ? countHits(targetSigs) : 0;
  const englishHits = targetLanguage !== 'en' ? countHits(englishSigs) : 0;

  // Confidence: ratio of target hits to total hits
  const totalHits = targetHits + englishHits;
  const confidence = totalHits === 0 ? 0.5 : targetHits / totalHits;

  // Decision rules:
  // - If we have NO signatures for this language, skip check (assume valid)
  if (targetSigs.length === 0) return { valid: true, confidence: 0.5 };

  // - Romanian, French, German, Spanish have diacritics → strong signal
  const hasDiacriticSig = ['ro', 'fr', 'de', 'es'].includes(targetLanguage);

  // - If targetLanguage has diacritics: even 1-2 hits = strong evidence
  //   → only fail if English hits >> target hits (ratio < 0.2)
  if (hasDiacriticSig) {
    if (targetHits === 0 && englishHits > 10) {
      return {
        valid: false,
        reason: `Zero ${targetLanguage} signatures found but ${englishHits} English signals detected. Content likely in English.`,
        confidence: 0
      };
    }
    // If we have at least some target hits, be lenient (technical terms inflate english count)
    if (targetHits >= 2) return { valid: true, confidence };
  }

  // - Generic: fail if confidence < 25% and we have enough signal
  if (totalHits >= 8 && confidence < 0.25) {
    return {
      valid: false,
      reason: `Language mismatch: ${Math.round(confidence * 100)}% ${targetLanguage} vs ${Math.round((1-confidence)*100)}% English signals in content sample.`,
      confidence
    };
  }

  return { valid: true, confidence };
}

function containsBannedPhrases(content: string, language: string = 'ro'): boolean {
  const lower = content.toLowerCase();
  
  // 1. Check specific language (Fast Path)
  const langPhrases = BANNED_PHRASES[language] || [];
  if (langPhrases.some(phrase => lower.includes(phrase))) return true;

  // 2. ALWAYS check English (system fallback)
  if (language !== 'en') {
      const enPhrases = BANNED_PHRASES['en'];
      if (enPhrases.some(phrase => lower.includes(phrase))) return true;
  }

  return false;
}

// ==========================================
// AI RESPONSE CACHE (dedup on identical prompts — see ai_cache table)
// ==========================================

function getServiceClient() {
  return createClient(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY);
}

async function hashPrompt(prompt: string): Promise<string> {
  const bytes = new TextEncoder().encode(prompt);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getCachedResponse(promptHash: string): Promise<string | null> {
  try {
    const { data, error } = await getServiceClient()
      .from('ai_cache')
      .select('response')
      .eq('prompt_hash', promptHash)
      .maybeSingle();
    if (error || !data) return null;
    return data.response ?? null;
  } catch (e) {
    Logger.warn(`[ai_cache] Read failed: ${e}`);
    return null;
  }
}

function cacheResponseFireAndForget(promptHash: string, prompt: string, response: string, model: string): void {
  getServiceClient()
    .from('ai_cache')
    .insert({ prompt_hash: promptHash, prompt: prompt.slice(0, 5000), response, model, provider: 'anthropic' })
    .then(({ error }: { error: any }) => {
      // 23505 = unique_violation: another concurrent call already cached this prompt — not an error.
      if (error && error.code !== '23505') {
        Logger.warn(`[ai_cache] Insert failed: ${error.message}`);
      }
    });
}

// Helper wrapper for existing business logic with RETRY & CLEANUP
async function callLLM(prompt: string, language: string = 'ro', isRetry: boolean = false): Promise<string> {
  const promptHash = await hashPrompt(prompt);
  if (!isRetry) {
    const cached = await getCachedResponse(promptHash);
    if (cached) {
      Logger.info('[ai_cache] Cache hit — skipping LLM call.');
      return cached;
    }
  }

  // Reset before the attempt so a call that fails BEFORE getting any response
  // (auth/network error) never re-logs a stale usage value from a prior call.
  _lastCallUsage = { inputTokens: 0, outputTokens: 0, model: 'unknown' };
  let response: string;
  try {
    response = await orchestrator.execute(prompt);
  } finally {
    // Log whatever usage the provider captured for THIS attempt, even if it
    // then threw (e.g. our own text-validation rejected an otherwise-billed
    // response) — real spend must not go untracked just because our own
    // validation rejected the output.
    if (_requestUserId && _lastCallUsage.inputTokens > 0) {
      logUsageFireAndForget(_requestUserId, _lastCallUsage.inputTokens, _lastCallUsage.outputTokens, _lastCallUsage.model, _requestAction);
    }
  }

  cacheResponseFireAndForget(promptHash, prompt, response, _lastCallUsage.model);

  // Phase 1: Fast Static Check
  if (containsBannedPhrases(response, language)) {
    if (isRetry || _retryBudget <= 0) {
      Logger.warn("Content still contains banned phrases after retry (or retry budget exhausted). Returning best effort.");
      return response;
    }
    Logger.warn(`Banned phrases detected (Static Check - Lang: ${language}). Retrying...`);
    _retryBudget--;
    return retryWithStrictInstructions(prompt, language, "Contains banned phrases (e.g. English words in Romanian text).");
  }

  // Phase 2: Deterministic Language Detector (replaces LLM Judge — zero extra AI calls)
  const langCheck = detectLanguageDeterministically(response, language);
  if (!langCheck.valid) {
    if (isRetry || _retryBudget <= 0) {
      Logger.warn(`[callLLM] Language check rejected RETRY attempt or retry budget exhausted: ${langCheck.reason}. Returning best effort.`);
    } else {
      Logger.warn(`[callLLM] Language mismatch detected (confidence: ${Math.round((langCheck.confidence || 0) * 100)}%): ${langCheck.reason}. Retrying with strict instructions.`);
      _retryBudget--;
      return retryWithStrictInstructions(prompt, language, langCheck.reason);
    }
  } else {
    Logger.info(`[callLLM] Language OK (confidence: ${Math.round((langCheck.confidence || 0.5) * 100)}% ${language}).`);
  }

  return response;
}

async function retryWithStrictInstructions(prompt: string, language: string, errorReason?: string): Promise<string> {
    const strictInstruction = `
    \n\n
    *** CRITICAL INSTRUCTION - STRICT MODE ***
    The previous output was REJECTED because: ${errorReason || "It contained apologetic or meta-conversational phrases."}

    YOU MUST FOLLOW THESE RULES:
    1. **LANGUAGE FIX**: Ensure ALL content is in **${language}**. Do NOT mix languages.
       - If ${language} is Romanian, NO English sentences allowed.
    2. **STYLE FIX**:
       - DO NOT apologize.
       - DO NOT ask for more context.
       - DO NOT say "I hope this helps".
       - DO NOT provide a "skeleton".
    3. **IMPERATIVE ONLY**: For instructions, use commands ("Do this"), not descriptions ("The user should do this").

    GENERATE THE CORRECTED CONTENT NOW.
    `;

    return callLLM(prompt + strictInstruction, language, true);
}

// ==========================================
// 3. TYPES (BUSINESS LOGIC)
// ==========================================

type CourseEnvironment = 'LIVE' | 'ONLINE';

/**
 * ModuleContext — the lightweight structural blueprint for a module.
 * Generated once, cached in course_modules.content_data.
 * Used as input for all per-deliverable generators (workbook, manual, slides, exercises).
 */
interface ModuleContext {
  contextVersion: 'v4.0';
  moduleId: string;
  moduleTitle: string;
  moduleDurationMinutes: number;
  environment: CourseEnvironment;
  language: string;
  targetAudience: string;
  keyConcepts: Array<{
    id: string;
    name: string;
    durationMinutes: number;
    type: 'THEORY' | 'ACTIVITY' | 'DISCUSSION' | 'BREAK';
    coreIdea: string;
    keyTerms: string[];
  }>;
  macroPosition: {
    isFirstModule: boolean;
    isLastModule: boolean;
    previousModuleTitle: string | null;
    nextModuleTitle: string | null;
    transitionNote: string;
  };
  timingPlan: Array<{
    sectionTitle: string;
    durationMinutes: number;
    type: 'INTRO' | 'THEORY' | 'EXAMPLE' | 'EXERCISE' | 'DEBRIEF' | 'TRANSITION' | 'BREAK';
    conceptRef: string | null;
  }>;
}

/** Environment (LIVE/ONLINE) delivery constraints — shared by the legacy DNA
 *  blocks below and by buildTonePreamble (A.3). Single source of truth so the
 *  two architectures never drift on what "ONLINE" or "LIVE" actually means. */
function buildEnvConstraints(environment?: string): string {
  return (environment || 'LIVE').toUpperCase() === 'ONLINE'
    ? `**ENVIRONMENT: ONLINE (VIRTUAL CLASSROOM — ZOOM/TEAMS)**
- INTERACTION: Must use "Breakout Rooms", "Chat Polls", "Miro Board links", "Screen Share".
- CONSTRAINTS: Max 10 min monologues (Zoom Fatigue). Frequent "Type in chat" prompts.
- MATERIALS: PDFs, Digital Workbooks, Online Quizzes.`
    : `**ENVIRONMENT: LIVE (IN-PERSON WORKSHOP)**
- INTERACTION: Face-to-face ONLY: "Turn to your neighbor", "Physical Flipcharts", "Room Movement", "Gallery Walk", "Role Play in room", "Group Discussions".
- FORBIDDEN: DO NOT mention videos, webinars, online dashboards, virtual forums, zoom links, or screen sharing.
- MATERIALS: Printed Workbooks, Sticky Notes, Markers, Flipchart paper.`;
}

// ==========================================
// F3-T1: PROMPT ARCHITECTURE (docs/CURATENIE-SI-MODERNIZARE-CourseCopilot.md §A.1/A.3)
// Installed here; consumed by the 7 new prompt files in F3-T2. Not yet wired
// into the Golden Path generators below (generateWorkbookContent etc.), which
// keep using buildDNABlocks()/fillPromptTemplate() unchanged for this task —
// per D-008, that pipeline still serves live users and F3-T1 must not touch it.
// ==========================================

/** The 7 standard layers of any content-generation prompt, assembled in this
 *  fixed order by buildPrompt(). Layers 1/5/6/7 are fixed per call type and
 *  live in prompts/<type>.ts (F3-T2); layers 2/3/4 are built from data at
 *  runtime (layer 2 via buildTonePreamble below). */
interface PromptLayers {
  roleFrame: string;
  tonePreamble: string;
  courseContext: string;
  unitContext: string;
  taskSpec: string;
  formatSpec: string;
  qualityRules: string;
}

/** Assembles the 7 prompt layers in order. Never concatenate ad-hoc — every
 *  new prompt (F3-T2 onward) goes through this single builder. */
function buildPrompt(layers: PromptLayers): string {
  return [
    layers.roleFrame,
    layers.tonePreamble,
    layers.courseContext,
    layers.unitContext,
    layers.taskSpec,
    layers.formatSpec,
    layers.qualityRules,
  ].filter(l => l && l.trim().length > 0).join('\n\n');
}

/** Layer 2 (TONE PREAMBLE) per §A.3 — replaces the old DNA voice/archetype
 *  system with the author's own verbatim voice sample. Identical across every
 *  call type that uses buildPrompt(). */
function buildTonePreamble(course: Course): string {
  const dna = course.dna;
  const terminology = dna?.terminology;

  const lines: string[] = [
    '## VOICE (verbatim from the course author — emulate faithfully)',
    `"${dna?.toneFreeText || 'Professional, clear, encouraging.'}"`,
    'Write every sentence as if this author wrote it. Their phrasing habits, warmth level,',
    'and humor apply to ALL prose, including exercise instructions and speaker notes.',
    '',
    '## TERMINOLOGY (mandatory)',
    `Use exactly: participant="${terminology?.participant || 'Participant'}", trainer="${terminology?.trainer || 'Trainer'}", exercise="${terminology?.exercise || 'Exercise'}".`,
  ];

  const mandatoryTermsList = terminology?.mandatoryTerms
    ? Object.values(terminology.mandatoryTerms)
        .map((v: any) => (v?.term ? `${v.term}${v.definition ? ` (${v.definition})` : ''}` : ''))
        .filter(Boolean)
        .join(', ')
    : '';
  if (mandatoryTermsList) lines.push(`Required terms: ${mandatoryTermsList}.`);

  if (terminology?.forbiddenPhrases?.length) {
    lines.push(`NEVER use: ${terminology.forbiddenPhrases.join(', ')}.`);
  }

  lines.push(
    '',
    '## DELIVERY ENVIRONMENT',
    buildEnvConstraints(course.environment),
    '',
    '## LANGUAGE',
    `Every word of output in ${course.language || 'Romanian'}. Technical loanwords standard in this language are allowed;`,
    'full sentences in any other language are not.',
  );

  return lines.join('\n');
}

/** Pre-built DNA context blocks ready for prompt injection (legacy Golden Path — D-008) */
interface DNABlocks {
  terminologyBlock: string;
  voiceProfileBlock: string;
  domainContextBlock: string;
  envConstraints: string;
}

/** Build DNA blocks from course for prompt injection */
function buildDNABlocks(course: Course): DNABlocks {
  // T1: Terminology
  let terminologyBlock = "";
  if (course.dna?.terminology) {
    const t = course.dna.terminology;
    terminologyBlock = `\n\n### TERMINOLOGY RULES (STRICT)\n` +
      `- Participant: ${t.participant || "Participant"}\n` +
      `- Exercise: ${t.exercise || "Exercise"}\n` +
      `- Trainer: ${t.trainer || "Trainer"}`;
    if (t.mandatoryTerms && Object.keys(t.mandatoryTerms).length > 0) {
      const termsList = Object.entries(t.mandatoryTerms).map(([k, v]: [string, any]) => {
        if (typeof v === 'object' && v !== null && v.term) return `${v.term} (${v.definition || ''})`;
        return `${k} -> ${v}`;
      }).join(', ');
      terminologyBlock += `\n- Mandatory Terms: ${termsList}`;
    }
    terminologyBlock += `\n`;
  }

  // T2: Voice — free-form verbatim voice sample (replaces the old
  // formality/humorLevel enums, which the model kept translating into
  // generic Mentor/Coach/Buddy archetypes instead of the author's actual voice).
  let voiceProfileBlock = "";
  if (course.dna?.toneFreeText) {
    voiceProfileBlock = `\n\n### VOICE & TONE (verbatim from the course author — emulate faithfully)\n"${course.dna.toneFreeText}"\nWrite every sentence as if this author wrote it.\n`;
  }
  if (course.dna?.terminology?.forbiddenPhrases?.length) {
    voiceProfileBlock += `- Forbidden phrases: ${course.dna.terminology.forbiddenPhrases.join(', ')}\n`;
  }

  // T4: Domain Context
  let domainContextBlock = "";
  if (course.dna?.domainContext) {
    const d = course.dna.domainContext;
    domainContextBlock = `\n\n### DOMAIN & INDUSTRY CONTEXT (CRITICAL)\n`;
    if (d.industryTerms && Object.keys(d.industryTerms).length > 0) {
      domainContextBlock += `**Industry Terms**:\n`;
      Object.entries(d.industryTerms).forEach(([term, def]) => { domainContextBlock += `- ${term}: ${def}\n`; });
    }
    if (d.clientProfiles?.length) {
      domainContextBlock += `\n**Client Profiles**:\n`;
      d.clientProfiles.forEach((cp: any) => { domainContextBlock += `- ${cp.type}: ${cp.decisionLogic} (Approach: ${cp.approach})\n`; });
    }
    if (d.productCatalog?.length) {
      domainContextBlock += `\n**Product Catalog**:\n`;
      d.productCatalog.forEach((pc: any) => { domainContextBlock += `- ${pc.category}: ${pc.items.join(', ')}\n`; });
    }
    if (d.competitorIntelligence?.length) {
      domainContextBlock += `\n**Competitor Intelligence**:\n`;
      d.competitorIntelligence.forEach((ci: any) => { domainContextBlock += `- ${ci.name} (Weakness: ${ci.weaknesses.join(', ')}) -> Counter: ${ci.counterStrategy}\n`; });
    }
    if (d.negotiationFrameworks?.length) {
      domainContextBlock += `\n**Negotiation Frameworks**:\n`;
      d.negotiationFrameworks.forEach((nf: any) => { domainContextBlock += `- ${nf.name}: ${nf.steps.join(' -> ')}\n`; });
    }
    domainContextBlock += `\n`;
  }

  // T5: Environment constraints
  const envConstraints = buildEnvConstraints(course.environment);

  return { terminologyBlock, voiceProfileBlock, domainContextBlock, envConstraints };
}

function isValidModuleContext(data: any): data is ModuleContext {
  if (!data || typeof data !== 'object') return false;
  if (data.contextVersion !== 'v4.0') return false;
  if (!data.moduleId || !data.moduleTitle) return false;
  if (!Array.isArray(data.keyConcepts) || data.keyConcepts.length === 0) return false;
  if (!data.macroPosition) return false;
  if (!Array.isArray(data.timingPlan) || data.timingPlan.length === 0) return false;
  return true;
}

// Kept for documentation — describes the old Golden JSON format (superseded by ModuleContext v4.0)
interface _LegacyGoldenSection {
  id: string;
  title: string;
  durationMinutes: number;
  type: 'THEORY' | 'ACTIVITY' | 'DISCUSSION' | 'VIDEO_LESSON' | 'ICE_BREAKER' | 'BREAK' | 'TRANSITION' | 'WARM_UP' | 'DEBRIEF';
  participantContent: {
    theoryMarkdown: string;
    keyTakeaways: string[];
    reflectionQuestions?: string[];
    actionableSteps?: string[];
  };
  trainerInstructions: {
    deliveryMethod: string;
    script: string;
    logistics: string[];
    flipchartSketch?: {
      title: string;
      visualDescription: string;
      bulletPoints: string[];
    };
    breakoutRoomConfig?: {
      groupSize: number;
      duration: number;
      taskDescription: string;
    };
  };
  visuals: {
    slidesSequence: Array<{
      slideId: string;
      layout: 'TITLE' | 'BULLETS' | 'VISUAL_FOCUS' | 'QUOTE' | 'SPLIT_SCREEN';
      title: string;
      visualDescription: string;
      contentBullets: string[];
      speakerNotes: string;
    }>;
  };
  exercisesDetailed?: {
    title: string;
    objective: string;
    durationMinutes: number;
    instructionsParticipant: string;
    instructionsFacilitator: string;
    materialsNeeded: string[];
    debriefingQuestions: string[];
    successIndicators: string[];
    adaptationNotes: string;
  };
  exerciseSequence?: Array<{
    title: string;
    type: 'ROLE_PLAY' | 'GROUP_WORKSHOP' | 'INDIVIDUAL' | 'SCENARIO' | 'ZONE_MAPPING';
    durationMinutes: number;
    instructionsParticipant: string;
    instructionsFacilitator: string;
    materialsNeeded: string[];
    debriefingQuestions: string[];
    successIndicators: string[];
  }>;
  videoScript?: {
    sceneDescription: string;
    scriptContent: string;
    visualOverlays: Array<{ timestamp: string; description: string }>;
  };
}

// ==========================================
// 4. PROMPTS & TEMPLATES
// ==========================================

/**
 * MODULE_CONTEXT_PROMPT — generates the lightweight structural blueprint (ModuleContext JSON).
 * Called once per module; result cached in course_modules.content_data.
 * This is NOT the actual content — it defines the structure, concepts, narrative, and timing plan.
 */
const MODULE_CONTEXT_PROMPT = `
You are an expert Instructional Designer. Analyze this training module and generate a ModuleContext JSON.
The ModuleContext is a STRUCTURAL BLUEPRINT — it defines *what* the module covers, NOT the actual written content.

### COURSE INFO
- Course: {{courseTitle}}
- Module: {{moduleTitle}} ({{durationMinutes}} min | Position: {{modulePosition}})
- Language: {{language}}
- Environment: {{environment}}
- Audience: {{targetAudience}}
- Learning Objectives: {{learningObjectives}}

### COURSE BLUEPRINT (All Modules)
{{moduleList}}

### DNA
{{terminology}}
{{voiceProfile}}
{{domainContext}}

### MACRO SCHEDULE CONTEXT
{{macroContext}}

### KNOWLEDGE BASE
{{knowledgeBase}}

---
### TASK
Generate a ModuleContext JSON with this EXACT schema (output ONLY valid JSON, no markdown fences, no explanation):
{
  "contextVersion": "v4.0",
  "moduleId": "{{moduleId}}",
  "moduleTitle": "{{moduleTitle}}",
  "moduleDurationMinutes": {{durationMinutes}},
  "environment": "{{environment}}",
  "language": "{{language}}",
  "targetAudience": "{{targetAudience}}",
  "keyConcepts": [
    {
      "id": "c1",
      "name": "[Concept name in {{language}}]",
      "durationMinutes": 20,
      "type": "THEORY",
      "coreIdea": "[2-3 sentence essence of this concept in {{language}}]",
      "keyTerms": ["term1", "term2"]
    }
  ],
  "macroPosition": {
    "isFirstModule": false,
    "isLastModule": false,
    "previousModuleTitle": null,
    "nextModuleTitle": null,
    "transitionNote": "[How this module connects to adjacent modules, in {{language}}]"
  },
  "timingPlan": [
    { "sectionTitle": "[title in {{language}}]", "durationMinutes": 10, "type": "INTRO", "conceptRef": null },
    { "sectionTitle": "[title in {{language}}]", "durationMinutes": 20, "type": "THEORY", "conceptRef": "c1" },
    { "sectionTitle": "[title in {{language}}]", "durationMinutes": 20, "type": "EXERCISE", "conceptRef": "c1" },
    { "sectionTitle": "[title in {{language}}]", "durationMinutes": 10, "type": "DEBRIEF", "conceptRef": null }
  ]
}

### STRICT RULES
1. Output ONLY valid JSON. No markdown, no commentary.
2. ALL string content MUST be in **{{language}}**.
3. timingPlan durations MUST sum to exactly {{durationMinutes}} minutes.
4. keyConcepts must cover the most important skills/knowledge for this specific module.
5. Include 3-6 keyConcepts covering all key topics of the module.
`;

/**
 * WORKBOOK_PROMPT — generates the participant workbook section for a module.
 * Input: ModuleContext JSON injected as variables. Output: rich Markdown, ready to print.
 */
const WORKBOOK_PROMPT = `
You are an expert Instructional Designer writing a **PARTICIPANT WORKBOOK** section for a professional training course.
This document is used directly by participants during the training. Make it complete, practical, and world-class.

### MODULE BLUEPRINT
- Module: {{moduleTitle}} ({{durationMinutes}} min)
- Environment: {{environment}}
- Language: {{language}}
- Audience: {{targetAudience}}

### KEY CONCEPTS
{{keyConcepts}}

### TIMING PLAN
{{timingPlan}}

### AUDIENCE DNA
{{styleBlock}}

### TERMINOLOGY
{{terminology}}

### VOICE & TONE
{{voiceProfile}}

### DEPTH SPECIFICATIONS
{{depthSpecs}}

### ENVIRONMENT CONSTRAINTS
{{envConstraints}}

### REFERENCE EXAMPLES (structure guide — use language {{language}}, not the language of the example)
{{goldenSamples}}

---
### TASK: Write the COMPLETE Participant Workbook section for this module.

**For EACH section in the timingPlan, write content in this order:**

#### 1. Section Header
Format: \`## [Section Type Icon] [Section Title] ([Duration] min)\`

#### 2. Why This Matters (150-200 words)
- Open with a provocative question or relatable pain point from {{targetAudience}} daily reality
- Connect the concept directly to their job/challenges
- End with a "By the end of this section, you will be able to..." sentence, written in {{language}}

#### 3. Core Theory (600-800 words per concept, ACTION-FIRST)
- Start with WHAT TO DO, not what to know
- Present a named model or framework (e.g., "The 3-Step ANCHOR Method")
- Anchor every key point with one worked example drawn from the audience's world
- Avoid passive voice and pure definitions
- Structure: concept → how it works → why it matters → what happens without it

#### 4. Real Story / Case Study (200+ words)
Invent a character with a realistic name for the {{language}} culture (they exist only in this story — no shared protagonist across the workbook). Use this structure:
> **Context:** [who they are, where, what challenge]
> [The mistake or wrong approach they tried first and why it failed]
> [The moment they applied the concept from this section]
> **Result:** [Specific, concrete positive outcome with numbers/dialogue if possible]

#### 5. Practical Exercise (for every EXERCISE type section)
Format:
\`\`\`
---
#### 🎯 {{exerciseTerm}}: [Title] (N min)
**{{objectiveLabel}}:** [Specific measurable skill practiced]

**Instructions:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Workspace:**
| [Column 1] | [Column 2] | [Column 3] |
|---|---|---|
| | | |
| | | |
| | | |

**Self-Assessment Checklist:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]
---
\`\`\`
IMPORTANT: Use realistic SCENARIO-BASED exercises. Never ask "What is X?". Frame the prompt around a locally-named character facing a concrete situation, and ask "What do you do?"

#### 6. Key Takeaways (3-5 items)
Format as blockquotes:
> 💡 [Memorable, actionable insight]
> 💡 [Another insight]

---
### STYLE RULES (NON-NEGOTIABLE)
- **Language**: ALL content in **{{language}}**. Zero exceptions — this includes every section header and table label in this template (they're written in English here only so a developer can read the prompt; translate each one into {{language}} in your output).
- **Terminology**: Use "{{participantTerm}}" for learner, "{{trainerTerm}}" for facilitator, "{{exerciseTerm}}" for activity.
- **Environment**: {{envRules}}
- **Tone**: Match the Audience DNA above.
- **No skeleton content**: Never write "[Insert story here]" or "[Describe concept]". Write ACTUAL content.
- **No meta-commentary**: Do NOT write "In this section we will learn...". Start directly with content.
- **Workbook workspaces**: Tables and checkboxes must be REAL formatted Markdown, not placeholders.

### OUTPUT FORMAT
Pure Markdown. Start directly with the first section header (## ...). No preamble or conclusion.
`;

/**
 * MANUAL_PROMPT — generates the facilitator/trainer manual for a module.
 * Input: ModuleContext JSON injected as variables. Output: rich Markdown manual, trainer-ready.
 */
const MANUAL_PROMPT = `
You are an expert Instructional Designer writing a **FACILITATOR MANUAL** for a professional trainer.
This is the trainer's bible — complete, actionable, and containing everything needed to deliver the module.

### MODULE BLUEPRINT
- Module: {{moduleTitle}} ({{durationMinutes}} min)
- Environment: {{environment}}
- Language: {{language}}
- Audience: {{targetAudience}}

### LESSON COVERAGE (Granular IDs for change-tracking)
{{lessonCoverage}}
<!-- Each lesson listed above has a stable lesson_id. If any lesson content changes,
     the corresponding section of this manual should be regenerated in isolation. -->

### KEY CONCEPTS
{{keyConcepts}}

### TIMING PLAN
{{timingPlan}}

### TERMINOLOGY
{{terminology}}

### VOICE & TONE
{{voiceProfile}}

### MACRO POSITION (Previous/Next modules)
{{macroPosition}}

### ENVIRONMENT CONSTRAINTS
{{envConstraints}}

---
### TASK: Write the COMPLETE Facilitator Manual for this module.

**Mandatory sections (in this order):**

#### 1. MODULE OVERVIEW (Trainer Briefing)
- Total duration and energy arc (how energy should flow from start to finish)
- 3-5 facilitation objectives (what YOU as trainer achieve in this module)
- Pre-module checklist (materials, room setup, technical checks)
- **Lesson Coverage**: List each lesson by its \`lesson_id\` and title — this is the index used to invalidate only affected sections when lessons change.

#### 2. TIMING TABLE (Minute-by-Minute Agenda)
Use a Markdown table with these columns:
| Minute | Segment | Trainer Action | Participant Action | Method | Material |
|---|---|---|---|---|---|
One row per section in the timing plan. Start times must be cumulative (0, 10, 30, 50...).
Times must sum to {{durationMinutes}} minutes.

#### 3. VERBATIM SCRIPT PER SECTION
For EACH section in the timing plan, use this structure:

---
##### [Section Icon] [Section Title] ([Duration] min)

**[TRANSITION / OPENING]**
> "[Exact words to say when entering this section. If it's the first section, this is the opening hook.]"

**[FACILITATOR INSTRUCTIONS]** *(imperative commands)*
- [What to do first]
- [What to say/show/write]
- [When to pause and check for understanding]
- [Watch for: common confusion points]

**[VERBATIM SCRIPT]** *(write what you say, in quotation marks)*
> "[Full trainer monologue/dialogue. Long enough to naturally fill the time allocated.]
> [Include a question to the group at a natural pause point.]"

**[IF THE GROUP RESISTS / IS CONFUSED]**
> "[Exact recovery words if participants seem lost, resistant, or disengaged]"

**[TRANSITION TO NEXT]**
> "[Bridge words connecting to the next section]"

---
#### 4. MATERIALS NEEDED
- [Complete list of physical/digital materials needed]

#### 5. FACILITATION TIPS (Specific to this audience and content)
- [Tip 1: specific to {{targetAudience}} and {{moduleTitle}}]
- [Tip 2]
- [Tip 3]

#### 6. ADAPTATION VARIANTS
| Situation | Adaptation |
|---|---|
| Advanced group (already knows the concepts) | [What to skip/accelerate] |
| Beginner group (no prior experience) | [What to slow down/add] |
| Limited time (-10 min vs. plan) | [What to cut without losing impact] |
| Extra time (+10 min vs. plan) | [What to deepen or add] |

---
### CRITICAL RULES
1. **IMPERATIVE ONLY**: All facilitator instructions are COMMANDS: "Explain...", "Ask...", "Write on flipchart...", "Divide into groups..."
   - BAD: "The trainer should explain the concept."
   - GOOD: "Explain the concept using the following analogy: ..."
2. **NO META-COMMENTARY**: Do NOT describe what a section is. Write actual instructions and scripts.
3. **LANGUAGE**: ALL content (including scripts) in **{{language}}**. This includes every section header, table column, and bracketed label in this template — they're written in English here only for the developer reading this prompt; translate each one into {{language}} in your output.
4. **VERBATIM SCRIPTS**: Must be long enough to fill the time. For a 15-min section, write 400+ words of script.
5. **SPECIFICITY**: Never write "Ask a question about the topic." Write: "Ask: '[Exact question]?' (pause 20 seconds)"
6. **ENVIRONMENT**: {{envRules}}

### OUTPUT FORMAT
Pure Markdown. Begin with the module title as a level-1 heading in {{language}}. No preamble.
`;

/**
 * SLIDES_PROMPT — generates presentation slides in XML format for a module.
 * Output: XML with SLIDE_BEGIN/END tags, ready for the slide renderer.
 */
const SLIDES_PROMPT = `
You are an expert Instructional Designer creating **PRESENTATION SLIDES** for a professional training course.

### MODULE BLUEPRINT
- Module: {{moduleTitle}} ({{durationMinutes}} min)
- Environment: {{environment}}
- Language: {{language}}
- Audience: {{targetAudience}}

### KEY CONCEPTS
{{keyConcepts}}

### TIMING PLAN
{{timingPlan}}

### AUDIENCE DNA
{{styleBlock}}

### TERMINOLOGY
{{terminology}}

### VOICE & TONE
{{voiceProfile}}

### ENVIRONMENT CONSTRAINTS
{{envConstraints}}

---
### TASK: Create the complete set of presentation slides for this module.

### SLIDE RULES
1. **QUANTITY**: 1 slide per 5-7 minutes. Target: {{slideCount}} slides for {{durationMinutes}} min.
2. **TITLE**: Maximum 7 words. Impact-focused. Use questions or strong statements, NOT generic titles like "Overview".
3. **CONTENT**: 3-4 bullet points MAXIMUM per slide. Each bullet: actionable, concrete, NOT a definition.
4. **VISUAL**: Describe a SPECIFIC, evocative visual the designer can actually create.
   - GOOD: "Split screen: left side shows a frustrated team in a meeting, right side shows the same team using the framework, energized and aligned"
   - BAD: "Image related to teamwork"
5. **SPEAKER NOTES**: FULL VERBATIM SCRIPT, 100-150 words per slide minimum. Include:
   - How to open this slide (hook question or statement)
   - Full explanation of the content
   - A concrete audience-relevant example (invent local characters as needed — they exist only inside the slide)
   - Interaction cue (question, show of hands, "type in chat" for online)
6. **FLOW**: Narrative arc across slides — Hook → Concept → Framework → Story → Application → Recap

### SLIDE LAYOUT OPTIONS
- TITLE_SLIDE: Module title with provocative subtitle
- HOOK: Opening challenge/question (minimal text, maximum impact)
- EXPLAINER: Concept with 3-4 bullets + visual
- STORY: Protagonist narrative (image-heavy, text-light)
- FRAMEWORK: Model or process diagram description
- EXERCISE_INTRO: Exercise setup (objective + instructions summary)
- RECAP: Key takeaways (3 max)
- TRANSITION: Bridge between sections

### OUTPUT FORMAT (use EXACTLY this XML format for each slide)
<SLIDE_BEGIN id="{{moduleId}}_1">
<TITLE>[Slide Title in {{language}}]</TITLE>
<!-- slide-layout: LAYOUT_TYPE -->
<VISUAL>[Specific visual description for the designer]</VISUAL>
<CONTENT>
- [Bullet 1 in {{language}}]
- [Bullet 2 in {{language}}]
- [Bullet 3 in {{language}}]
</CONTENT>
<NOTES>
[Full verbatim trainer script, 100-150 words minimum, in {{language}}]
</NOTES>
<SLIDE_END id="{{moduleId}}_1">

### CRITICAL OUTPUT INSTRUCTIONS
1. **NO MARKDOWN WRAPPERS**: Do NOT wrap your output in "xml" or "markdown" code blocks. Start directly with the first "<SLIDE_BEGIN id=\"...\">" and end with the last "</SLIDE_END>". No preamble, intro, or concluding text.
2. **STRICT IDS**: The slide IDs must start exactly at "{{moduleId}}_1" and increment consecutively ("{{moduleId}}_2", "{{moduleId}}_3", etc.).
3. **STRICT TAGS**: Ensure all tags like "<TITLE>", "<VISUAL>", "<CONTENT>", "<NOTES>" are in uppercase, correctly opened, and closed. Do not omit the slide-layout comment inside the block.
4. **ALL CONTENT IN {{language}}**: Every title, bullet point, visual description, and speaker note must be strictly in {{language}}.
`;

/**
 * EXERCISES_PROMPT — generates standalone exercise sheets for a module.
 * Output: Markdown handouts, usable separately from the workbook.
 */
const EXERCISES_PROMPT = `
You are an expert Instructional Designer creating **EXERCISE SHEETS** for a professional training course.
These are standalone handouts — complete, practical, usable without the workbook.

### MODULE BLUEPRINT
- Module: {{moduleTitle}} ({{durationMinutes}} min)
- Environment: {{environment}}
- Language: {{language}}
- Audience: {{targetAudience}}

### KEY CONCEPTS
{{keyConcepts}}

### TIMING PLAN (focus on EXERCISE-type sections)
{{timingPlan}}

### DEPTH SPECIFICATIONS
{{depthSpecs}}

### ENVIRONMENT CONSTRAINTS
{{envConstraints}}

---
### TASK: Create DETAILED EXERCISE SHEETS for ALL practical activities in this module.

**For each EXERCISE or ACTIVITY section in the timing plan:**

---
## 🎯 {{exerciseTerm}}: [Exercise Title] ([Duration] min)

**Format:** [INDIVIDUAL / PAIRS / GROUPS OF 3-4 / FULL GROUP]
**{{objectiveLabel}}:** [Specific, measurable skill practiced — NOT "understand X" but "apply X to scenario Y"]

### Participant Instructions
[Numbered step-by-step instructions from the participant's perspective]
[Include any role descriptions, scenario setup, or materials they need]

### Workspace
[REAL formatted workspace — tables, checkboxes, fill-in grids]
[NOT a placeholder like "(write your answer here)"]
[Example: a comparison table, a role-play script template, a decision matrix]

### Facilitator Instructions

**Timing Breakdown:**
| Stage | Duration | Facilitator Action | Participant Action |
|---|---|---|---|
| Setup | X min | [Exact setup instructions] | [What they prepare] |
| Execution | Y min | [What trainer observes/supports] | [What they do] |
| Debrief | Z min | [How to facilitate debrief] | [What they share] |

**Observer Checklist** *(for facilitator while participants work)*:
- [ ] [Key behavior/skill to look for]
- [ ] [Common mistake to watch for and how to correct]
- [ ] [Success indicator]
- [ ] [Red flag: what would mean the exercise needs to be paused]

**Debrief Questions:**
1. [Factual: "What happened when...?"]
2. [Analytical: "Why do you think...?"]
3. [Applicative: "How will you use this tomorrow morning?"]
4. [Generalization: "What general principle can we extract?"]

**Success Indicators:**
- [ ] [Participant can do X]
- [ ] [Participant demonstrates Y]

**Adaptation:**
- Resistant group: [Specific instruction]
- Group moving too fast: [What to add/deepen]

---

### CRITICAL RULES
1. **SCENARIO-BASED**: Never ask "What is X?" — always use realistic scenarios from {{targetAudience}} context
2. **LOCAL CHARACTERS**: For every exercise, invent the characters you need with distinct, realistic names appropriate for the {{language}} culture. Give each character a concrete role, stake, and tension that makes the dilemma unavoidable. Characters exist ONLY inside this exercise — never carry names across exercises. Do NOT reuse a single "protagonist"; every scenario has its own cast.
3. **LANGUAGE**: ALL content in **{{language}}**, including every section header and table label in this template (they're written in English here only for the developer reading this prompt; translate each one into {{language}} in your output)
4. **ENVIRONMENT**: {{envRules}}
5. **REAL WORKSPACES**: Tables and checkboxes must be ACTUAL Markdown, not placeholder text
6. **COMPLETE**: Each exercise sheet must be usable as a standalone handout

Output pure Markdown. One exercise per section. No preamble.
`;

/**
 * VIDEO_SCRIPT_PROMPT — generates video scripts for online course modules.
 * Output: Markdown scripts with scene descriptions, verbatim dialogue, and visual overlay notes.
 */
const VIDEO_SCRIPT_PROMPT = `
You are an expert Instructional Designer writing **VIDEO SCRIPTS** for an online training course.
These scripts are used directly for video production — complete, professional, and ready to record.

### MODULE BLUEPRINT
- Module: {{moduleTitle}} ({{durationMinutes}} min)
- Language: {{language}}
- Audience: {{targetAudience}}
- Tone: {{voiceProfile}}

### KEY CONCEPTS
{{keyConcepts}}

### TIMING PLAN
{{timingPlan}}

---
### TASK: Write VIDEO SCRIPTS for each section of this module.

**For each section in the timing plan:**

---
## 🎬 Video Script: [Section Title] ([Duration] min)
**Format:** [Talking Head / Screen Share + Talking Head / Animation Overlay / B-Roll with VO]
**Tone:** [e.g., Professional & Warm, Direct, Energetic]

### [SCENE 1: HOOK — Talking Head] (~30-45 sec)
**(Visual: Instructor looking at camera, professional setting or relevant background)**

"[Opening — relatable pain point OR surprising statistic]
[Connect immediately to the participant's reality]
[Promise: e.g. "In the next N minutes, I'll show you how to...", written in {{language}}]"

---
### [SCENE 2: MAIN CONCEPT] (~N min)
**(Visual: [Specific description: animation showing the model / screen recording / diagram overlay])**

"[Clear explanation of the concept — action-first, not definition-first]
[Key insight: e.g. "Most people believe X. But in reality, Y.", written in {{language}}]
[Named model or framework with 3 steps]
[Example told as a short story, using a character invented for this scene with a realistic name for {{language}} culture]"

---
### [SCENE 3: DEMONSTRATION / EXAMPLE] (~N min)
**(Visual: [Screen recording / Split screen / B-Roll footage description])**

"[Walk through a concrete before/after example]
[Invent a character with a realistic name for {{language}} culture; they exist only in this scene]
[Compare old approach vs. new approach with specific outcomes]"

---
### [SCENE 4: CALL TO ACTION] (~30 sec)
**(Visual: Instructor on camera)**

"[Recap the single most important takeaway in one sentence]
[Specific action: e.g. "Pause the video now. Open your workbook to page X and complete exercise Y.", written in {{language}}]
[Bridge: e.g. "In the next module, we'll explore...", written in {{language}}]"

**Production Notes:**
- Overlay at [timestamp]: [Text/graphic to appear]
- Lower third at [timestamp]: [Name/title to show]

---
### RULES
1. Language: ALL script content in **{{language}}**, including every section/scene header and bracketed label in this template (they're written in English here only for the developer reading this prompt; translate each one into {{language}} in your output)
2. Scripts must be COMPLETE — write actual words, no placeholders
3. Tone matches the voice profile defined above
4. CTAs must be specific and actionable
5. Each scene transition should be natural and scripted

Output pure Markdown.
`;

// ==========================================
// 5. UTILS (PARSER & REPAIR)
// ==========================================

function repairAndParseJson<T>(text: string): T {
  let cleaned = text.trim();

  // 0. XML Extraction (Silent Operator Protocol)
  // We prioritize the content inside <content_block> tags.
  const xmlMatch = cleaned.match(/<content_block>([\s\S]*?)<\/content_block>/);
  if (xmlMatch) {
    cleaned = xmlMatch[1].trim();
  }

  // 1. Remove Markdown Fences
  const fenceMatch = cleaned.match(/```json([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else {
      const genericFence = cleaned.match(/```([\s\S]*?)```/);
      if (genericFence) {
          cleaned = genericFence[1].trim();
      }
  }

  // 2. Find outer braces or brackets (Object or Array)
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  // Determine if we are looking for an Array or an Object
  // If '[' appears before '{', it's likely an array.
  const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
  
  if (isArray) {
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
          cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
  } else {
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    Logger.warn("JSON Parse Error 1st attempt:", e);
    // 3. Last resort: specific fixes
    try {
        const fixed = cleaned
            .replace(/(?<!\\)\n/g, '\\n');
        return JSON.parse(fixed) as T;
    } catch (e2) {
        throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

type RenderTarget = 'WORKBOOK' | 'MANUAL' | 'EXERCISES' | 'EXAMPLES' | 'VIDEO_SCRIPT';

const renderToMarkdown = (data: GoldenModuleData, target: RenderTarget, contextInfo?: string): string => {
  let output = '';

  // 1. Header Global — use styled HTML for WORKBOOK, plain markdown otherwise
  if (target === 'WORKBOOK') {
    // Calculate practical vs theory split based on section types
    const totalSections = data.sections?.length || 1;
    const practicalTypes = ['ACTIVITY', 'ICE_BREAKER', 'WARM_UP', 'DEBRIEF', 'DISCUSSION'];
    const practicalCount = (data.sections || []).filter(s => practicalTypes.includes(s.type)).length;
    const practicalPercent = Math.round((practicalCount / totalSections) * 100);
    const theoryPercent = 100 - practicalPercent;
    output += `<div style="margin-bottom:24px;">`;
    output += `<h1 style="color:#1a1a2e;font-size:22px;margin-bottom:4px;font-family:Arial,sans-serif;">${data.moduleTitle}</h1>`;
    output += `<p style="color:#666;font-size:13px;margin:0;font-family:Arial,sans-serif;">${data.moduleDurationMinutes} minute | ${practicalPercent}% Activitate practică + ${theoryPercent}% Teorie</p>`;
    output += `<hr style="border:0;border-top:2px solid #4a90d9;margin:8px 0 16px 0;">`;
    output += `</div>`;
  } else {
    output += `# ${data.moduleTitle}\n`;
    output += `**Duration:** ${data.moduleDurationMinutes} min | **Format:** ${data.environment}\n\n`;
  }

  // --- DOMAIN CONTEXT ---
  if (data.domainContext) {
      output += `> **DOMAIN CONTEXT**\n`;
      if (data.domainContext.industryTerms) {
          const terms = Object.entries(data.domainContext.industryTerms).map(([k, v]) => `${k}: ${v}`).join('; ');
          output += `> *Terms:* ${terms.substring(0, 100)}...\n`;
      }
      output += `\n`;
  }

  if (target === 'MANUAL' && contextInfo) {
      output += `> **COURSE CONTEXT (VERIFICATION)**\n`;
      output += `> This content was generated based on the following constraints:\n`;
      output += `> ${contextInfo.replace(/\n/g, '\n> ')}\n\n`;
      output += `---\n\n`;
  }

  if (target === 'EXAMPLES') {
      return renderExamplesLibrary(data);
  }

  // 2. Iterate through sections
  data.sections.forEach((section, index) => {
    if (target === 'WORKBOOK') {
      output += `<hr style="border:0;border-top:1px solid #e0e0e0;margin:20px 0;">\n`;
      // Section header is rendered inside renderWorkbookSection for activity types;
      // for theory it's also rendered there. No separate header needed.
    } else {
      output += `---\n\n`; // Section separator
      output += `## Section ${index + 1}: ${section.title} (${section.durationMinutes} min)\n\n`;
    }

    switch (target) {
      case 'WORKBOOK':
        output += renderWorkbookSection(section, data.localizedLabels, data.domainContext);
        break;
      case 'MANUAL':
        output += renderManualSection(section, data.narrativeContext.protagonistName, data.localizedLabels);
        break;
      case 'EXERCISES':
        if (section.exercisesDetailed) {
           output += renderExerciseSheet(section.exercisesDetailed, data.localizedLabels);
        }
        if (section.exerciseSequence && Array.isArray(section.exerciseSequence)) {
            section.exerciseSequence.forEach(ex => {
                output += renderExerciseSequenceItem(ex, data.localizedLabels);
            });
        }
        if (!section.exercisesDetailed && (!section.exerciseSequence || section.exerciseSequence.length === 0)) {
            output += `*(${data.localizedLabels?.activity || 'No detailed exercises in this section'})*\n\n`;
        }
        break;
       case 'VIDEO_SCRIPT':
         if (section.videoScript) {
             output += renderVideoScript(section.videoScript, data.localizedLabels);
         }
         break;
    }
    output += `\n\n`;
  });

  return cleanMarkdown(output);
};

// Helper: escape HTML special characters to prevent XSS in generated content
const escHtml = (s: string): string =>
  String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Helper: convert plain text with newlines to HTML paragraphs (preserves structure)
const textToHtmlParagraphs = (text: string): string => {
  if (!text) return '';
  // Split on double newlines for paragraphs, single newlines become <br>
  return text.split(/\n{2,}/).map(para =>
    `<p style="margin:6px 0;line-height:1.6;">${para.replace(/\n/g, '<br>')}</p>`
  ).join('');
};

const renderWorkbookSection = (section: GoldenSection, labels: GoldenModuleData['localizedLabels'], domainContext?: GoldenModuleData['domainContext']): string => {
  const ACTIVITY_TYPES = ['ACTIVITY', 'ICE_BREAKER', 'WARM_UP', 'DEBRIEF'];
  const font = 'font-family:Arial,sans-serif;';

  // BREAK
  if (section.type === 'BREAK') {
    return `<div style="text-align:center;padding:12px;color:#888;${font}border:1px dashed #ccc;margin:12px 0;border-radius:4px;">☕ ${escHtml(section.title || 'Pauză')} — ${section.durationMinutes} min</div>\n`;
  }

  const content = section.participantContent;
  const exercise = section.exercisesDetailed;

  if (!content && !exercise && (!section.exerciseSequence || section.exerciseSequence.length === 0)) {
    return `<p style="color:#c00;${font}"><em>Conținut lipsă pentru secțiunea "${escHtml(section.title)}". Regenerați modulul.</em></p>\n`;
  }

  let html = '';

  // ----- ACTIVITY BOX -----
  if (ACTIVITY_TYPES.includes(section.type)) {
    const actLabel = (labels as any)?.activityLabel || labels?.activity || 'ACTIVITATE';
    html += `<div style="border:1px solid #28a745;border-radius:4px;margin:16px 0;${font}">`;
    html += `<div style="background:#28a745;color:white;padding:8px 14px;font-weight:bold;font-size:14px;">${escHtml(actLabel)}: ${escHtml(section.title)} (${section.durationMinutes} min)</div>`;
    html += `<div style="padding:12px 14px;">`;

    if (content?.theoryMarkdown) {
      // Parse numbered/bulleted lists from theoryMarkdown for activity instructions
      const lines = content.theoryMarkdown.split('\n').filter((l: string) => l.trim());
      html += `<table style="width:100%;border-collapse:collapse;">`;
      lines.forEach((line: string) => {
        const clean = line.replace(/^[-*•\d+\.]\s*/, '').trim();
        if (clean) html += `<tr><td style="padding:5px 8px;border-bottom:1px solid #e8f5e9;">${escHtml(clean)}</td></tr>`;
      });
      html += `</table>`;
    }

    if (content?.keyTakeaways?.length) {
      const whyLabel = (labels as any)?.whyWeDoThis || 'De ce facem asta?';
      html += `<div style="padding:8px 14px 4px;font-style:italic;color:#2e7d32;font-weight:600;">${escHtml(whyLabel)}</div>`;
      html += `<table style="width:100%;border-collapse:collapse;">`;
      content.keyTakeaways.forEach((pt: string) => {
        html += `<tr><td style="padding:4px 14px;color:#555;">${escHtml(pt)}</td></tr>`;
      });
      html += `</table>`;
    }

    html += `</div></div>\n`;

  // ----- THEORY / DISCUSSION -----
  } else {
    html += `<h3 style="color:#1a1a2e;border-bottom:2px solid #4a90d9;padding-bottom:4px;margin:16px 0 8px 0;${font}">${escHtml(section.title)}</h3>`;

    if (content?.theoryMarkdown) {
      html += `<div style="${font}line-height:1.7;margin-bottom:12px;">${textToHtmlParagraphs(content.theoryMarkdown)}</div>`;
    }

    // Client profiles comparison table (from domainContext)
    if (domainContext?.clientProfiles && Array.isArray(domainContext.clientProfiles) && domainContext.clientProfiles.length >= 2) {
      const HEADER_COLORS = ['#1a3c6e', '#2e7d32', '#b71c1c', '#6a1b9a'];
      const profiles = domainContext.clientProfiles.slice(0, 4);
      html += `<table style="width:100%;border-collapse:collapse;margin:16px 0;">`;
      html += `<tr>`;
      profiles.forEach((p: any, idx: number) => {
        html += `<th style="background:${HEADER_COLORS[idx] || '#444'};color:white;padding:10px;text-align:center;${font}">${escHtml(p.type || `Tip ${idx+1}`)}</th>`;
      });
      html += `</tr>`;
      // Row: decisionLogic
      html += `<tr>`;
      profiles.forEach((p: any) => {
        html += `<td style="padding:8px;border:1px solid #ddd;vertical-align:top;${font}">${escHtml(p.decisionLogic || '')}</td>`;
      });
      html += `</tr>`;
      // Row: approach
      if (profiles.some((p: any) => p.approach)) {
        html += `<tr>`;
        profiles.forEach((p: any) => {
          html += `<td style="padding:8px;border:1px solid #ddd;vertical-align:top;background:#f9f9f9;${font}">${escHtml(p.approach || '')}</td>`;
        });
        html += `</tr>`;
      }
      html += `</table>`;
    }

    if (content?.keyTakeaways?.length) {
      const ktLabel = labels?.keyTakeaways || 'Idei cheie';
      html += `<div style="background:#f0f7ff;border-left:4px solid #4a90d9;padding:10px 14px;margin:12px 0;${font}">`;
      html += `<strong>🔑 ${escHtml(ktLabel)}:</strong><ul style="margin:6px 0 0 0;padding-left:20px;">`;
      content.keyTakeaways.forEach((pt: string) => {
        html += `<li style="margin:4px 0;">${escHtml(pt)}</li>`;
      });
      html += `</ul></div>`;
    }

    if (content?.actionableSteps?.length) {
      const apLabel = labels?.actionPlan || 'Plan de acțiune';
      html += `<div style="margin:12px 0;${font}"><strong>🚀 ${escHtml(apLabel)}:</strong><ol style="margin:6px 0 0 0;padding-left:20px;">`;
      content.actionableSteps.forEach((step: string) => {
        html += `<li style="margin:4px 0;">${escHtml(step)}</li>`;
      });
      html += `</ol></div>`;
    }
  }

  // ----- EXERCISE BOX (applies to both activity and theory sections) -----
  const renderExerciseBox = (ex: NonNullable<GoldenSection['exercisesDetailed']>) => {
    const actLabel = labels?.activity || 'Exercițiu';
    const objLabel = labels?.objective || 'Obiectiv';
    const instrLabel = labels?.instructionsParticipant || 'Instrucțiuni';
    const debriefLabel = labels?.debrief || 'Checklist succes';
    let exHtml = `<div style="border:1px solid #ff9800;border-radius:4px;margin:16px 0;${font}">`;
    exHtml += `<div style="background:#ff9800;color:white;padding:8px 14px;font-weight:bold;">🎯 ${escHtml(actLabel)}: ${escHtml(ex.title || '')}${ex.durationMinutes ? ` — ${ex.durationMinutes} min` : ''}</div>`;
    exHtml += `<div style="padding:12px 14px;">`;
    if (ex.objective) exHtml += `<p style="margin:0 0 8px 0;"><strong>${escHtml(objLabel)}:</strong> ${escHtml(ex.objective)}</p>`;
    if (ex.instructionsParticipant) {
      exHtml += `<p style="margin:0 0 4px 0;"><strong>${escHtml(instrLabel)}:</strong></p>`;
      // Parse numbered steps from instruction text
      const lines = ex.instructionsParticipant.split('\n').filter((l: string) => l.trim());
      exHtml += `<ol style="padding-left:20px;margin:4px 0 12px 0;">`;
      lines.forEach((line: string) => {
        const clean = line.replace(/^\d+\.\s*/, '').trim();
        if (clean) exHtml += `<li style="margin:4px 0;">${escHtml(clean)}</li>`;
      });
      exHtml += `</ol>`;
    }
    // Workspace area
    exHtml += `<div style="border:1px dashed #aaa;min-height:80px;padding:8px;margin:8px 0;background:#fafafa;color:#999;font-style:italic;">Spațiu de lucru...</div>`;
    if (ex.successIndicators?.length) {
      exHtml += `<p style="margin:8px 0 4px 0;"><strong>${escHtml(debriefLabel)}:</strong></p>`;
      ex.successIndicators.forEach((item: string) => {
        exHtml += `<div style="margin:3px 0;">☐ ${escHtml(item)}</div>`;
      });
    }
    exHtml += `</div></div>`;
    return exHtml;
  };

  if (exercise) {
    html += renderExerciseBox(exercise);
  }

  if (section.exerciseSequence?.length) {
    section.exerciseSequence.forEach((ex: any) => {
      html += renderExerciseBox({
        title: ex.title,
        objective: ex.type,
        durationMinutes: ex.durationMinutes,
        instructionsParticipant: ex.instructionsParticipant || '',
        instructionsFacilitator: ex.instructionsFacilitator || '',
        materialsNeeded: ex.materialsNeeded || [],
        debriefingQuestions: ex.debriefingQuestions || [],
        successIndicators: ex.successIndicators || [],
        adaptationNotes: ex.adaptationNotes || '',
      });
    });
  }

  if (content?.reflectionQuestions?.length) {
    const reflLabel = labels?.reflection || 'Reflecție';
    html += `<div style="margin:16px 0;${font}"><strong>🤔 ${escHtml(reflLabel)}:</strong>`;
    content.reflectionQuestions.forEach((q: string) => {
      html += `<div style="margin:10px 0;">`;
      html += `<p style="font-weight:600;margin:0 0 4px 0;">${escHtml(q)}</p>`;
      html += `<div style="border-bottom:1px solid #ccc;min-height:40px;margin-bottom:4px;"></div>`;
      html += `<div style="border-bottom:1px solid #ccc;min-height:40px;"></div>`;
      html += `</div>`;
    });
    html += `</div>`;
  }

  return html;
};

const renderManualSection = (section: GoldenSection, protagonistName: string, labels: GoldenModuleData['localizedLabels']): string => {
  const instr = section.trainerInstructions;
  if (!instr) {
      return `> Missing trainer instructions for section "${section.title}"\n`;
  }

  let md = `### 👨‍🏫 ${labels?.trainerInstructions || 'Trainer Instructions'}\n`;
  md += `**${labels?.method || 'Method'}:** ${instr.deliveryMethod || 'N/A'}\n\n`;

  if (instr.logistics && instr.logistics.length > 0) {
      md += `**🛠️ Logistics:** ${instr.logistics.join(', ')}\n\n`;
  }

  if (instr.facilitatorPrep) {
      md += `**📋 Prep:** ${instr.facilitatorPrep}\n\n`;
  }

  if (instr.breakoutRoomConfig) {
      md += `**👥 Breakout Rooms:**\n`;
      md += `*Time:* ${instr.breakoutRoomConfig.durationMinutes} min | *Size:* ${instr.breakoutRoomConfig.groupSize} ppl\n`;
      md += `*Task:* ${instr.breakoutRoomConfig.taskDescription}\n\n`;
  }

  if (instr.script) {
      md += `#### 🗣️ ${labels?.script || 'Script (Verbatim)'}\n`;
      md += `> ${instr.script.replace(/\n/g, '\n> ')}\n\n`;
  }

  if (section.visuals && section.visuals.slidesSequence.length > 0) {
      md += `#### 📊 ${labels?.slidesSequence || 'Slides Sequence'}\n`;
      section.visuals.slidesSequence.forEach(slide => {
          md += `- **[Slide] ${slide.title}** (${slide.type})\n`;
          if (slide.bullets) slide.bullets.forEach(b => md += `  - ${b}\n`);
      });
  }

  return md;
};


/** Build a fallback ModuleContext when LLM generation fails */
function buildFallbackModuleContext(
  course: Course,
  moduleData: any,
): ModuleContext {
  const modules = (course.blueprint && Array.isArray(course.blueprint.modules)) ? course.blueprint.modules : [];
  const moduleIndex = moduleData.module_index ?? 0;
  const duration = moduleData.duration_minutes || 60;
  // Only Romanian gets Romanian section titles; every other language falls back to
  // English rather than silently defaulting to Romanian (same fix as COST_ZERO_SLIDES_LABELS).
  const isRoFallback = (course.language || '').toLowerCase().startsWith('ro');
  const fallbackTitles = isRoFallback
    ? { intro: 'Introducere', theory: 'Concepte Cheie', exercise: 'Aplicare Practică', debrief: 'Debrief & Concluzii' }
    : { intro: 'Introduction', theory: 'Key Concepts', exercise: 'Practical Application', debrief: 'Debrief & Conclusions' };

  return {
    contextVersion: 'v4.0',
    moduleId: moduleData.id,
    moduleTitle: moduleData.title,
    moduleDurationMinutes: duration,
    environment: course.environment as CourseEnvironment || 'LIVE',
    language: course.language || 'ro',
    targetAudience: course.target_audience || 'General',
    keyConcepts: [{
      id: 'c1',
      name: moduleData.title,
      durationMinutes: Math.round(duration * 0.6),
      type: 'THEORY',
      coreIdea: `Core concepts for ${moduleData.title}`,
      keyTerms: [],
    }],
    macroPosition: {
      isFirstModule: moduleIndex === 0,
      isLastModule: moduleIndex === modules.length - 1,
      previousModuleTitle: moduleIndex > 0 ? (modules[moduleIndex - 1]?.title || null) : null,
      nextModuleTitle: moduleIndex < modules.length - 1 ? (modules[moduleIndex + 1]?.title || null) : null,
      transitionNote: 'Continues from previous module concepts.',
    },
    timingPlan: [
      { sectionTitle: fallbackTitles.intro, durationMinutes: 10, type: 'INTRO', conceptRef: null },
      { sectionTitle: fallbackTitles.theory, durationMinutes: Math.round(duration * 0.4), type: 'THEORY', conceptRef: 'c1' },
      { sectionTitle: fallbackTitles.exercise, durationMinutes: Math.round(duration * 0.35), type: 'EXERCISE', conceptRef: 'c1' },
      { sectionTitle: fallbackTitles.debrief, durationMinutes: Math.round(duration * 0.15), type: 'DEBRIEF', conceptRef: null },
    ],
  };
}

/** Generate (or regenerate) the ModuleContext JSON and save it to course_modules.content_data */
async function generateModuleContext(
  supabase: any,
  course: Course,
  moduleData: any,
): Promise<ModuleContext> {
  const lang = course.language || 'ro';
  const dna = buildDNABlocks(course);
  const modules = (course.blueprint && Array.isArray(course.blueprint.modules)) ? course.blueprint.modules : [];
  const moduleIndex = moduleData.module_index ?? 0;
  const moduleList = modules.map((m: any, i: number) => `${i + 1}. ${m.title} (${m.duration || '45 min'})`).join('\n');

  // MacroContext: position in schedule
  let macroContext = `Module ${moduleIndex + 1} of ${modules.length}.`;
  if (course.macro_plan && Array.isArray(course.macro_plan.macroBlocks)) {
    const blocks = course.macro_plan.macroBlocks;
    const idx = blocks.findIndex((b: any) =>
      b.moduleRef === moduleData.id ||
      (b.title && moduleData.title && b.title.toLowerCase() === moduleData.title.toLowerCase())
    );
    if (idx !== -1) {
      const prev = idx > 0 ? blocks[idx - 1] : null;
      const next = idx < blocks.length - 1 ? blocks[idx + 1] : null;
      macroContext = `Block #${idx + 1} of ${blocks.length}. Duration: ${blocks[idx].duration} min.`;
      if (prev) macroContext += ` Previous: "${prev.title || prev.type}" (${prev.duration} min).`;
      if (next) macroContext += ` Next: "${next.title || next.type}" (${next.duration} min).`;
    }
  }

  const knowledgeBase = await buildKnowledgeBaseContext(supabase, course.id, lang);
  const mandatoryCtx = buildMandatoryContext(course);

  const prompt = fillPromptTemplate(MODULE_CONTEXT_PROMPT, {
    courseTitle: course.title || 'Untitled',
    moduleTitle: moduleData.title,
    durationMinutes: moduleData.duration_minutes || 60,
    modulePosition: `${moduleIndex + 1} of ${modules.length}`,
    language: lang,
    environment: course.environment || 'LIVE',
    targetAudience: course.target_audience || 'General',
    learningObjectives: String((course as any).learning_objectives || 'Not specified'),
    moduleList,
    terminology: dna.terminologyBlock,
    voiceProfile: dna.voiceProfileBlock,
    domainContext: dna.domainContextBlock,
    macroContext,
    knowledgeBase,
    moduleId: moduleData.id,
  });

  try {
    const rawJson = await callLLM(`${mandatoryCtx}\n\n${prompt}`, lang);
    const ctx = repairAndParseJson<ModuleContext>(rawJson);
    if (!isValidModuleContext(ctx)) throw new Error('ModuleContext failed validation');
    ctx.moduleId = moduleData.id;
    ctx.contextVersion = 'v4.0';
    ctx.language = lang;
    ctx.environment = course.environment as CourseEnvironment || 'LIVE';
    return ctx;
  } catch (e: any) {
    Logger.error('Failed to generate ModuleContext, using fallback.', e);
    return buildFallbackModuleContext(course, moduleData);
  }
}

/** Build a formatted string of key concepts for prompt injection */
function formatKeyConcepts(ctx: ModuleContext): string {
  return ctx.keyConcepts.map((c, i) =>
    `${i + 1}. **${c.name}** (${c.durationMinutes} min, ${c.type})\n   Core: ${c.coreIdea}\n   Terms: ${(c.keyTerms || []).join(', ') || 'N/A'}`
  ).join('\n');
}

/** Build a formatted timing plan string for prompt injection */
function formatTimingPlan(ctx: ModuleContext): string {
  return ctx.timingPlan.map(t =>
    `- [${t.type}] "${t.sectionTitle}" (${t.durationMinutes} min)${t.conceptRef ? ` → concept: ${t.conceptRef}` : ''}`
  ).join('\n');
}

// ---- Per-Deliverable Generator Functions ----

const COST_ZERO_SLIDES_LABELS: Record<string, any> = {
  ro: {
    objective: "Obiectiv",
    exerciseTitle: "Activitate Practică",
    recapTitle: "Recapitulare",
    welcomeNotes: (title: string) => `Bun venit la această secțiune. Astăzi vom discuta despre "${title}".`,
    objNotes: (obj: string) => `Obiectivul nostru principal este să: ${obj}.`,
    takeawayNotes: (takeaway: string) => `În acest slide, analizăm o idee fundamentală: "${takeaway}". Este important să înțelegem cum se transpune această idee în practică.`,
    exerciseNotes: "Acum este timpul să punem în practică teoria. Vom realiza o activitate aplicată pentru a consolida conceptele discutate.",
    exerciseBullet1: "Aplicarea conceptelor prezentate prin exercițiu practic",
    exerciseBullet2: "Lucru individual sau în echipă",
    recapNotes: "Pentru a încheia, haideți să recapitulăm cele mai importante idei de astăzi:",
    recapNotesEnd: "Acestea sunt punctele cheie care ne vor ghida în continuare."
  },
  en: {
    objective: "Objective",
    exerciseTitle: "Practical Activity",
    recapTitle: "Recap",
    welcomeNotes: (title: string) => `Welcome to this section. Today, we will discuss "${title}".`,
    objNotes: (obj: string) => `Our primary objective is to: ${obj}.`,
    takeawayNotes: (takeaway: string) => `In this slide, we analyze a key takeaway: "${takeaway}". It is important to understand how to apply this concept in our daily work.`,
    exerciseNotes: "Now it is time to put theory into practice. We will do a hands-on activity to reinforce the concepts discussed.",
    exerciseBullet1: "Applying the concepts presented through a hands-on exercise",
    exerciseBullet2: "Individual or team work",
    recapNotes: "To wrap up, let's review the main takeaways from today:",
    recapNotesEnd: "These are the key points that will guide us moving forward."
  }
};

function generateCostZeroSlides(lesson: any, lang: string = 'ro'): string {
  const lessonId = lesson.id;
  const title = lesson.title;
  const objective = lesson.learning_objective || "";
  const takeaways = Array.isArray(lesson.key_takeaways) ? lesson.key_takeaways : [];
  const hasExercise = lesson.has_exercise === true;

  // Only Romanian gets the Romanian dictionary; every other language (including the
  // ~100 non-RO/EN languages in src/languages.ts, which have no dedicated dictionary
  // here) falls back to English rather than silently defaulting to Romanian.
  const dictionary = (lang || '').toLowerCase().startsWith('ro')
    ? COST_ZERO_SLIDES_LABELS.ro
    : COST_ZERO_SLIDES_LABELS.en;

  let xml = "";
  let slideIndex = 1;

  // Slide 1: Title
  xml += `<SLIDE_BEGIN id="${lessonId}_${slideIndex}">\n`;
  xml += `<TITLE>${title}</TITLE>\n`;
  xml += `<!-- slide-layout: TITLE -->\n`;
  xml += `<VISUAL>Minimalist slide background with clean modern typography centered</VISUAL>\n`;
  xml += `<CONTENT>\n`;
  if (objective) {
    xml += `- ${dictionary.objective}: ${objective}\n`;
  }
  xml += `</CONTENT>\n`;
  xml += `<NOTES>\n`;
  xml += `${dictionary.welcomeNotes(title)}\n`;
  if (objective) {
    xml += `${dictionary.objNotes(objective)}\n`;
  }
  xml += `</NOTES>\n`;
  xml += `<SLIDE_END id="${lessonId}_${slideIndex}">\n\n`;
  slideIndex++;

  // Slides 2..N-1: Explainer slides per takeaway
  takeaways.forEach((takeaway: string) => {
    xml += `<SLIDE_BEGIN id="${lessonId}_${slideIndex}">\n`;
    const slideTitle = takeaway.length > 40 ? takeaway.slice(0, 37) + "..." : takeaway;
    xml += `<TITLE>${slideTitle}</TITLE>\n`;
    xml += `<!-- slide-layout: EXPLAINER -->\n`;
    xml += `<VISUAL>A clean, professional diagram illustrating the concept: ${takeaway}</VISUAL>\n`;
    xml += `<CONTENT>\n`;
    xml += `- ${takeaway}\n`;
    xml += `</CONTENT>\n`;
    xml += `<NOTES>\n`;
    xml += `${dictionary.takeawayNotes(takeaway)}\n`;
    xml += `</NOTES>\n`;
    xml += `<SLIDE_END id="${lessonId}_${slideIndex}">\n\n`;
    slideIndex++;
  });

  // Slide Exercise (if hasExercise)
  if (hasExercise) {
    xml += `<SLIDE_BEGIN id="${lessonId}_${slideIndex}">\n`;
    xml += `<TITLE>${dictionary.exerciseTitle}</TITLE>\n`;
    xml += `<!-- slide-layout: EXERCISE -->\n`;
    xml += `<VISUAL>Collaborative workshop session, team working together on a challenge</VISUAL>\n`;
    xml += `<CONTENT>\n`;
    xml += `- ${dictionary.exerciseBullet1}\n`;
    xml += `- ${dictionary.exerciseBullet2}\n`;
    xml += `</CONTENT>\n`;
    xml += `<NOTES>\n`;
    xml += `${dictionary.exerciseNotes}\n`;
    xml += `</NOTES>\n`;
    xml += `<SLIDE_END id="${lessonId}_${slideIndex}">\n\n`;
    slideIndex++;
  }

  // Slide Last: Summary
  xml += `<SLIDE_BEGIN id="${lessonId}_${slideIndex}">\n`;
  xml += `<TITLE>${dictionary.recapTitle}</TITLE>\n`;
  xml += `<!-- slide-layout: SUMMARY -->\n`;
  xml += `<VISUAL>Summary checklist or structural roadmap illustration</VISUAL>\n`;
  xml += `<CONTENT>\n`;
  takeaways.slice(0, 4).forEach((takeaway: string) => {
    xml += `- ${takeaway}\n`;
  });
  xml += `</CONTENT>\n`;
  xml += `<NOTES>\n`;
  xml += `${dictionary.recapNotes}\n`;
  takeaways.forEach((takeaway: string) => {
    xml += `- ${takeaway}\n`;
  });
  xml += `${dictionary.recapNotesEnd}\n`;
  xml += `</NOTES>\n`;
  xml += `<SLIDE_END id="${lessonId}_${slideIndex}">`;

  return xml;
}

/** Generate participant workbook markdown for a module */
async function generateWorkbookContent(course: Course, ctx: ModuleContext, dna: DNABlocks): Promise<string> {
  const lang = ctx.language || course.language || 'ro';
  const isOnline = ctx.environment === 'ONLINE';
  const specsObj = getDepthSpecs(lang, isOnline ? 'online' : 'live');
  const goldenSamples = isOnline ? GOLDEN_SAMPLES.workbook_online : GOLDEN_SAMPLES.workbook_live;
  const envRules = isOnline
    ? 'ONLINE: Use digital templates, "Type in chat" activities, no physical group exercises.'
    : 'LIVE: Physical activities, printed workbooks, flipcharts. ABSOLUTELY NO online/zoom references.';

  const prompt = fillPromptTemplate(WORKBOOK_PROMPT, {
    moduleTitle: ctx.moduleTitle,
    durationMinutes: ctx.moduleDurationMinutes,
    environment: ctx.environment,
    language: lang,
    targetAudience: ctx.targetAudience,
    keyConcepts: formatKeyConcepts(ctx),
    timingPlan: formatTimingPlan(ctx),
    styleBlock: getStyleBlock(course.target_audience || ''),
    terminology: dna.terminologyBlock,
    voiceProfile: dna.voiceProfileBlock,
    depthSpecs: specsObj.workbook,
    envConstraints: dna.envConstraints,
    envRules,
    goldenSamples,
    participantTerm: course.dna?.terminology?.participant || 'Participant',
    trainerTerm: course.dna?.terminology?.trainer || 'Trainer',
    exerciseTerm: course.dna?.terminology?.exercise || 'Exercise',
    objectiveLabel: (lang || '').startsWith('ro') ? 'Obiectiv' : 'Objective',
  });

  const result = await callLLM(`${buildMandatoryContext(course)}\n\n${prompt}`, lang);
  return result;
}

/** Generate facilitator/trainer manual markdown for a module */
async function generateManualContent(
  course: Course,
  ctx: ModuleContext,
  dna: DNABlocks,
  supabase?: any
): Promise<string> {
  const lang = ctx.language || course.language || 'ro';
  const isOnline = ctx.environment === 'ONLINE';
  const envRules = isOnline
    ? 'ONLINE: Use Breakout Rooms, Chat Polls, Miro Boards. Max 10 min monologues.'
    : 'LIVE: Face-to-face activities only. Flipcharts, role-plays, group discussions. NO virtual tools.';

  const macroPos = `Previous module: ${ctx.macroPosition.previousModuleTitle || 'None (this is first)'}\nNext module: ${ctx.macroPosition.nextModuleTitle || 'None (this is last)'}\nTransition note: ${ctx.macroPosition.transitionNote}`;

  // 🟡 IMPORTANT: Fetch lessons for this module to enable granular lesson_id tracking
  // This allows the manual to know EXACTLY which lesson IDs it covers,
  // so when a lesson changes, only the affected section needs regeneration.
  let lessonCoverage = 'N/A (no lesson data available — manual operates at module level)';
  if (supabase && ctx.moduleId) {
    try {
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('id, title, order_index, learning_objective')
        .eq('module_id', ctx.moduleId)
        .order('order_index');
      if (lessons && lessons.length > 0) {
        lessonCoverage = lessons.map((l: any) =>
          `- lesson_id: ${l.id} | "${l.title}" | Objective: ${l.learning_objective || 'N/A'}`
        ).join('\n');
        Logger.info(`[generateManualContent] Injecting ${lessons.length} lesson IDs for traceability.`);
      }
    } catch (err) {
      Logger.warn('[generateManualContent] Could not fetch lessons for lesson coverage.', err);
    }
  }

  const prompt = fillPromptTemplate(MANUAL_PROMPT, {
    moduleTitle: ctx.moduleTitle,
    durationMinutes: ctx.moduleDurationMinutes,
    environment: ctx.environment,
    language: lang,
    targetAudience: ctx.targetAudience,
    lessonCoverage,
    keyConcepts: formatKeyConcepts(ctx),
    timingPlan: formatTimingPlan(ctx),
    terminology: dna.terminologyBlock,
    voiceProfile: dna.voiceProfileBlock,
    macroPosition: macroPos,
    envConstraints: dna.envConstraints,
    envRules,
  });

  const result = await callLLM(`${buildMandatoryContext(course)}\n\n${prompt}`, lang);
  return result;
}

/** Generate presentation slides XML for a module */
async function generateSlidesContent(course: Course, ctx: ModuleContext, dna: DNABlocks, supabase?: any): Promise<string> {
  const lang = ctx.language || course.language || 'ro';

  // 1. Try to fetch lessons from DB for cost-zero mapping
  if (supabase) {
    try {
      const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('module_id', ctx.moduleId)
        .order('order_index');

      if (!error && lessons && lessons.length > 0) {
        Logger.info(`[generateSlidesContent] Found ${lessons.length} lessons. Generating slides with cost-zero mapping.`);
        const slideXmls = lessons.map((lesson: any) => generateCostZeroSlides(lesson, lang));
        return slideXmls.join('\n\n');
      }
    } catch (err) {
      Logger.warn('[generateSlidesContent] Failed to fetch lessons, falling back to AI.', err);
    }
  }

  // 2. Legacy Fallback: AI generated slides
  Logger.info(`[generateSlidesContent] Falling back to LLM Slides Generation.`);
  const isOnline = ctx.environment === 'ONLINE';
  const slideCount = Math.round(ctx.moduleDurationMinutes / 6);
  const envRules = isOnline
    ? 'ONLINE: Include "Type in chat" and poll cues in speaker notes.'
    : 'LIVE: Include show-of-hands, think-pair-share cues in speaker notes. NO virtual tool references.';

  const prompt = fillPromptTemplate(SLIDES_PROMPT, {
    moduleTitle: ctx.moduleTitle,
    durationMinutes: ctx.moduleDurationMinutes,
    environment: ctx.environment,
    language: lang,
    targetAudience: ctx.targetAudience,
    keyConcepts: formatKeyConcepts(ctx),
    timingPlan: formatTimingPlan(ctx),
    styleBlock: getStyleBlock(course.target_audience || ''),
    terminology: dna.terminologyBlock,
    voiceProfile: dna.voiceProfileBlock,
    envConstraints: dna.envConstraints,
    envRules,
    moduleId: ctx.moduleId,
    slideCount,
  });

  const result = await callLLM(`${buildMandatoryContext(course)}\n\n${prompt}`, lang);
  return result;
}

/** Generate exercise sheets markdown for a module */
async function generateExercisesContent(course: Course, ctx: ModuleContext, dna: DNABlocks): Promise<string> {
  const lang = ctx.language || course.language || 'ro';
  const isOnline = ctx.environment === 'ONLINE';
  const specsObj = getDepthSpecs(lang, isOnline ? 'online' : 'live', 80);
  const envRules = isOnline
    ? 'ONLINE: Individual or breakout room exercises. Provide digital templates.'
    : 'LIVE: Physical exercises, printed handouts. Groups, pairs, or individual. NO virtual tools.';

  const prompt = fillPromptTemplate(EXERCISES_PROMPT, {
    moduleTitle: ctx.moduleTitle,
    durationMinutes: ctx.moduleDurationMinutes,
    environment: ctx.environment,
    language: lang,
    targetAudience: ctx.targetAudience,
    keyConcepts: formatKeyConcepts(ctx),
    timingPlan: formatTimingPlan(ctx),
    depthSpecs: specsObj.exercises,
    envConstraints: dna.envConstraints,
    envRules,
    exerciseTerm: course.dna?.terminology?.exercise || 'Exercise',
    objectiveLabel: (lang || '').startsWith('ro') ? 'Obiectiv' : 'Objective',
  });

  const result = await callLLM(`${buildMandatoryContext(course)}\n\n${prompt}`, lang);
  return result;
}

/** Generate video scripts markdown for an online module */
async function generateVideoScriptContent(course: Course, ctx: ModuleContext, dna: DNABlocks): Promise<string> {
  const lang = ctx.language || course.language || 'ro';

  const prompt = fillPromptTemplate(VIDEO_SCRIPT_PROMPT, {
    moduleTitle: ctx.moduleTitle,
    durationMinutes: ctx.moduleDurationMinutes,
    language: lang,
    targetAudience: ctx.targetAudience,
    voiceProfile: dna.voiceProfileBlock,
    keyConcepts: formatKeyConcepts(ctx),
    timingPlan: formatTimingPlan(ctx),
  });

  const result = await callLLM(`${buildMandatoryContext(course)}\n\n${prompt}`, lang);
  return result;
}

/** Granular Lesson Content Generator (Single Source of Generation) */
async function generateLessonContent(supabase: any, lessonId: string, stepType: string): Promise<string> {
  Logger.info(`[generateLessonContent] Generating content for lesson_id=${lessonId}, step_type=${stepType}`);

  // 1. Fetch lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson) {
    throw new Error(`Lesson not found: ${lessonId}`);
  }

  // 2. Fetch course
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', lesson.course_id)
    .single();

  if (courseError || !courseData) {
    throw new Error(`Course not found: ${lesson.course_id}`);
  }

  const environment = (courseData.environment || '').toLowerCase().includes('online') ? 'ONLINE' : 'LIVE';
  const course: Course = {
    ...courseData,
    environment
  };

  // 3. Build DNA blocks
  const dna = buildDNABlocks(course);

  // 5. Construct LessonContext (Fake ModuleContext but focused on this lesson)
  const lang = course.language || 'ro';
  const timingPlan = [{
    sectionTitle: lesson.title,
    durationMinutes: lesson.estimated_minutes || 15,
    type: (lesson.has_exercise ? 'EXERCISE' : 'THEORY') as any,
    conceptRef: null
  }];

  const keyConcepts = [{
    id: lesson.id,
    name: lesson.title,
    durationMinutes: lesson.estimated_minutes || 15,
    type: (lesson.has_exercise ? 'ACTIVITY' : 'THEORY') as any,
    coreIdea: lesson.learning_objective || '',
    keyTerms: Array.isArray(lesson.key_takeaways) ? lesson.key_takeaways : []
  }];

  const ctx: ModuleContext = {
    contextVersion: 'v4.0',
    moduleId: lesson.module_id,
    moduleTitle: lesson.title,
    moduleDurationMinutes: lesson.estimated_minutes || 15,
    environment: environment as CourseEnvironment,
    language: lang,
    targetAudience: course.target_audience || 'General',
    keyConcepts,
    macroPosition: {
      isFirstModule: false,
      isLastModule: false,
      previousModuleTitle: null,
      nextModuleTitle: null,
      transitionNote: ''
    },
    timingPlan
  };

  // 6. Generate content based on stepType
  switch (stepType) {
    case 'course.steps.slides':
    case 'slides':
      return generateCostZeroSlides(lesson, lang);

    case 'course.steps.workbook':
    case 'participant_workbook':
      return generateWorkbookContent(course, ctx, dna);

    case 'course.steps.manual':
    case 'facilitator_manual':
    case 'trainer_manual':
    case 'facilitator_notes':
      // Pass supabase if available in this context (for lesson_id injection)
      return generateManualContent(course, ctx, dna, (typeof supabase !== 'undefined' ? supabase : undefined));

    case 'course.steps.exercises':
    case 'exercises':
      return generateExercisesContent(course, ctx, dna);

    case 'course.steps.video_scripts':
    case 'video_scripts':
      return generateVideoScriptContent(course, ctx, dna);

    case 'course.steps.examples':
    case 'examples_and_stories':
      return generateExamplesContent(course, ctx, dna);

    default:
      throw new Error(`Unknown step type for lesson content: ${stepType}`);
  }
}


/** Generate examples/stories markdown for a module */
async function generateExamplesContent(course: Course, ctx: ModuleContext, dna: DNABlocks): Promise<string> {
  const lang = ctx.language || course.language || 'ro';
  const prompt = `
**TASK**: Write 3-5 detailed stories/examples for the training module "${ctx.moduleTitle}".
**LANGUAGE**: ${lang}
**AUDIENCE**: ${ctx.targetAudience}

**KEY CONCEPTS**:
${formatKeyConcepts(ctx)}

For each story, invent one or two characters with distinct, realistic names appropriate for ${lang} culture. Characters exist only inside their story — no shared protagonist across stories.

Use this format (headers below are shown in English for the developer reading this prompt — translate them into ${lang} in your output):
## Example: [Title]
**When to use:** [applicationContext]

"[Full story: Context → Problem → Action → Result. Minimum 150 words each. Use the invented character as protagonist.]"

---

Write ALL in **${lang}**. No preamble.
`;
  const result = await callLLM(`${buildMandatoryContext(course)}\n\n${prompt}`, lang);
  return result;
}

// ==========================================
// 6. MAIN HANDLER (CONTROLLER)
// ==========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Course {
  id: string;
  title: string;
  description?: string;
  target_audience: string;
  environment: 'LIVE' | 'ONLINE';
  language: string;
  blueprint?: any;
  learning_objectives?: string;
  dna?: any;
  macro_plan?: {
    macroBlocks: Array<{
      type: 'INTRO' | 'CONTENT_BLOCK' | 'BREAK' | 'WRAP_UP';
      duration: number;
      title?: string;
      moduleRef?: string;
      purpose?: string;
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action } = body;

    // Reset the per-request retry budget so a prior (warm-isolate) request's
    // leftover count can never affect this one.
    _retryBudget = 5;

    Logger.info(`Request received. Action: ${action}`);

    // ==========================================
    // AI CREDIT GATE
    // Blocks AI generation if user is over their monthly limit.
    // Non-AI actions, health checks, and credit_status queries bypass this.
    // FAIL-OPEN: if the credit system errors, generation proceeds normally.
    // ==========================================
    const NON_AI_ACTIONS = [
      'ping', 'provider_status', 'test_connection', 'credit_status',
    ];
    const isDryRunBackfill = action === 'backfill_key_takeaways' && body.dry_run !== false;

    if (!NON_AI_ACTIONS.includes(action) && !isDryRunBackfill) {
      try {
        // Get user from JWT
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
          const { data: { user: authUser } } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
          );
          if (authUser?.id) {
            _requestUserId = authUser.id;
            _requestAction = action;
            const opCost = ACTION_OPERATION_COSTS[action] ?? 1;
            if (opCost > 0) {
              const { data: creditResult } = await supabase.rpc('increment_ai_operations', {
                p_user_id: authUser.id,
                p_amount: opCost,
              });
              if (creditResult && !creditResult.allowed) {
                Logger.warn(`[CreditGate] User ${authUser.id} is over limit: ${creditResult.used}/${creditResult.limit}`);
                return new Response(JSON.stringify({
                  error: 'credit_limit_exceeded',
                  message: `Ai atins limita lunară de ${creditResult.limit} operații AI. Utilizate: ${creditResult.used}. Te rugăm să aștepți resetarea lunară sau să upgradezi planul.`,
                  credit_status: creditResult,
                }), {
                  status: 402,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            } else {
              // Cost-zero action — just verify user hasn't exceeded limit without consuming
              const { data: creditStatus } = await supabase.rpc('get_ai_credit_status', {
                p_user_id: authUser.id,
              });
              if (creditStatus && creditStatus.is_over_limit) {
                Logger.warn(`[CreditGate] User ${authUser.id} is over limit (cost-zero action): ${creditStatus.used}/${creditStatus.limit}`);
                return new Response(JSON.stringify({
                  error: 'credit_limit_exceeded',
                  message: `Ai atins limita lunară de ${creditStatus.limit} operații AI. Utilizate: ${creditStatus.used}. Te rugăm să aștepți resetarea lunară sau să upgradezi planul.`,
                  credit_status: creditStatus,
                }), {
                  status: 402,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            }
          }
        }
      } catch (creditErr) {
        // Fail open — don't block generation if credit system has an error
        Logger.warn('[CreditGate] Credit check failed (fail-open):', creditErr);
      }
    }

    // ==========================================
    // HEALTH CHECKS & DIAGNOSTICS
    // ==========================================

    if (action === 'ping') {
      return new Response(JSON.stringify({ message: 'pong', version: '3.0-MODULAR' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'credit_status') {
      // Returns current credit status for the authenticated user.
      // Does NOT consume any credits.
      try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Not authenticated' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { data: { user: authUser } } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        if (!authUser?.id) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { data: status } = await supabase.rpc('get_ai_credit_status', { p_user_id: authUser.id });
        return new Response(JSON.stringify(status), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'provider_status') {
      return new Response(JSON.stringify({
        claudeConfigured: !!Config.ANTHROPIC_API_KEY,
        activeProvider: Config.ANTHROPIC_API_KEY ? 'claude' : 'none'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'test_connection') {
       Logger.info("Starting connection test...");
       const results: any = {};

       // Test Claude
       try {
         const claude = new ClaudeProvider();
         if (claude.isConfigured()) {
            const resp = await claude.generateContent("Hi");
            results.claude = { status: 200, ok: true, body: resp };
         } else {
            results.claude = { status: "missing_key" };
         }
       } catch (e: any) {
         results.claude = { error: e.message };
       }

       return new Response(JSON.stringify(results), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       });
    }

    // ==========================================
    // SPECIAL ACTIONS (No Course ID required)
    // ==========================================
    if (action === 'analyze_upload') {
        const { fileContent, fileName, environment } = body;
        const result = await handleAnalyzeUpload(fileContent, fileName, environment);
        return new Response(JSON.stringify({ content: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'complete_sections_for_import') {
        const { blueprint, environment, language } = body;
        const result = await handleCompleteSectionsForImport(blueprint, environment, language);
        return new Response(JSON.stringify({ content: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'fill_gaps') {
        const { blueprint, existingContent, environment } = body;
        const result = await handleFillGaps(blueprint, existingContent, environment);
        return new Response(JSON.stringify({ content: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'generate_learning_objectives') {
        const { course } = body;
        const result = await handleGenerateLearningObjectives(course);
        return new Response(JSON.stringify({ content: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'generate_localized_labels') {
      const { course, language } = body;
      const result = await handleGenerateLocalizedLabels(course, language);
      return new Response(JSON.stringify({ labels: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'chat_onboarding') {
        const { chat_history, course } = body;
        const result = await handleChatOnboarding(chat_history, course);
        return new Response(JSON.stringify({ content: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (action === 'refine_blueprint') {
        const { course, blueprint, language } = body;
        const result = await handleRefineBlueprint(course, blueprint, language);
        return new Response(JSON.stringify({ content: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // ==========================================
    // NEW: Client-Side Iteration Handlers
    // ==========================================

    if (action === 'generate_workbook_part') {
        const { part_type, course, module_data, module_index } = body;
        
        if (part_type === 'intro') {
             const result = await generateWorkbookIntro(course);
             return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        if (part_type === 'outro') {
             const result = await generateWorkbookOutro(course);
             return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        if (part_type === 'module') {
             const targetModuleId = await resolveModuleId(supabase, course.id, module_data, module_index);
             const result = await handleGoldenStep(supabase, course, targetModuleId, 'course.steps.workbook');
             return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
    }

    if (action === 'generate_slides_part') {
        const { course, module_data, module_index } = body;
        const targetModuleId = await resolveModuleId(supabase, course.id, module_data, module_index);
        const result = await handleGoldenStep(supabase, course, targetModuleId, 'course.steps.slides');
        return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate_exercises_part') {
        const { course, module_data, module_index } = body;
        const targetModuleId = await resolveModuleId(supabase, course.id, module_data, module_index);
        const result = await handleGoldenStep(supabase, course, targetModuleId, 'exercises');
        return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate_examples_part') {
        const { course, module_data, module_index } = body;
        const targetModuleId = await resolveModuleId(supabase, course.id, module_data, module_index);
        const result = await handleGoldenStep(supabase, course, targetModuleId, 'examples_and_stories');
        return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate_manual_part') {
        const { course, module_data, module_index } = body;
        const targetModuleId = await resolveModuleId(supabase, course.id, module_data, module_index);
        const result = await handleGoldenStep(supabase, course, targetModuleId, 'facilitator_manual');
        return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ============================================================
    // ACTION: backfill_key_takeaways
    // One-time backfill for legacy courses missing key_takeaways.
    // Reads existing module context and extracts takeaways per lesson via AI.
    // Set dry_run=true (default) for preview; dry_run=false to commit.
    // ============================================================
    if (action === 'backfill_key_takeaways') {
      const { course_id: bfCourseId, dry_run = true } = body;
      if (!bfCourseId) {
        return new Response(JSON.stringify({ error: 'Missing course_id for backfill' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch all lessons for this course that need backfill
      const { data: lessonsToBackfill, error: bfErr } = await supabase
        .from('course_lessons')
        .select('id, title, learning_objective, module_id')
        .eq('course_id', bfCourseId)
        .or('key_takeaways.is.null,key_takeaways.eq.[]');

      if (bfErr || !lessonsToBackfill) {
        return new Response(JSON.stringify({ error: 'Failed to fetch lessons', detail: bfErr?.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (lessonsToBackfill.length === 0) {
        return new Response(JSON.stringify({ message: 'No lessons need backfill', count: 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      Logger.info(`[backfill] Found ${lessonsToBackfill.length} lessons needing key_takeaways backfill (dry_run=${dry_run})`);

      // Fetch course for language context
      const { data: bfCourse } = await supabase.from('courses').select('*').eq('id', bfCourseId).single();
      const lang = bfCourse?.language || 'ro';

      const results: Array<{ lesson_id: string; title: string; takeaways: string[]; committed: boolean }> = [];

      for (const lesson of lessonsToBackfill) {
        const extractPrompt = `You are extracting key takeaways from a training lesson.

Lesson Title: "${lesson.title}"
Learning Objective: "${lesson.learning_objective || 'N/A'}"
Language: ${lang}

Generate EXACTLY 3 concise key takeaways for this lesson.
Each takeaway should be a complete, actionable sentence in ${lang}.
Format: JSON array of strings. Example: ["Takeaway 1", "Takeaway 2", "Takeaway 3"]

OUTPUT JSON ONLY. No markdown, no explanation.`;

        try {
          const raw = await orchestrator.execute(extractPrompt);
          const takeaways = repairAndParseJson<string[]>(raw);

          if (Array.isArray(takeaways) && takeaways.length > 0) {
            results.push({ lesson_id: lesson.id, title: lesson.title, takeaways, committed: false });

            if (!dry_run) {
              // Commit to DB
              await supabase
                .from('course_lessons')
                .update({ key_takeaways: takeaways })
                .eq('id', lesson.id);
              results[results.length - 1].committed = true;
              Logger.info(`[backfill] Committed takeaways for lesson: ${lesson.title}`);
            }
          } else {
            Logger.warn(`[backfill] Failed to extract takeaways for lesson: ${lesson.title}`);
          }
        } catch (err) {
          Logger.error(`[backfill] Error for lesson ${lesson.id}:`, err);
        }
      }

      return new Response(JSON.stringify({
        dry_run,
        processed: results.length,
        total_lessons: lessonsToBackfill.length,
        results,
        message: dry_run
          ? `Preview: ${results.length} lessons ready for backfill. Call with dry_run=false to commit.`
          : `Committed key_takeaways for ${results.filter(r => r.committed).length}/${results.length} lessons.`,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'generate_lesson_content') {
        const { lesson_id, step_type } = body;
        const result = await generateLessonContent(supabase, lesson_id, step_type);
        return new Response(JSON.stringify({ content: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { step_type, module_id, context, blueprint_duration, explicit_module_list, contractPipeline } = body;
    const course_id = body.course_id || body.course?.id;
    const useContractPipeline = Boolean(contractPipeline);

    Logger.info(`[Main] Received request: step_type=${step_type}, course_id=${course_id}, module_id=${module_id}, contractPipeline=${useContractPipeline}`);

    if (!course_id) throw new Error("Missing course_id");
    
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', course_id)
      .single();
    
    if (courseError || !courseData) throw new Error("Course not found");

    const environment = (courseData.environment || '').toLowerCase().includes('online') ? 'ONLINE' : 'LIVE';
    
    const course: Course = {
      ...courseData,
      environment
    };

    let result = "";

    // A0. Per-module steps sent without module_id (e.g. from general generate_step_content flow)
    // Auto-iterate over all course modules and concatenate results.
    const PER_MODULE_STEPS_AUTO = [
      'exercises', 'course.steps.exercises',
      'examples_and_stories', 'course.steps.examples',
      'facilitator_notes', 'course.steps.manual',
      'facilitator_manual', 'trainer_manual',
      'course.steps.manual',
      'slides', 'course.steps.slides',
      'participant_workbook', 'course.steps.workbook',
      'video_scripts', 'course.steps.video_scripts',
    ];
    if (!module_id && PER_MODULE_STEPS_AUTO.includes(step_type)) {
      let { data: courseModules } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', course.id)
        .order('module_index');

      // If course_modules is empty but blueprint has modules, auto-create them first
      if (!courseModules || courseModules.length === 0) {
        const blueprintModules = course.blueprint?.modules;
        if (!blueprintModules || !Array.isArray(blueprintModules) || blueprintModules.length === 0) {
          throw new Error(`No modules found for course ${course.id} (step: ${step_type})`);
        }
        Logger.info(`[Auto-iterate] course_modules empty. Initializing ${blueprintModules.length} modules from blueprint...`);
        for (let i = 0; i < blueprintModules.length; i++) {
          await resolveModuleId(supabase, course.id, blueprintModules[i], i);
        }
        const { data: refetched } = await supabase
          .from('course_modules')
          .select('*')
          .eq('course_id', course.id)
          .order('module_index');
        if (!refetched || refetched.length === 0) {
          throw new Error(`No modules found for course ${course.id} (step: ${step_type})`);
        }
        courseModules = refetched;
      }

      const promises = courseModules.map((m) => handleGoldenStep(supabase, course, m.id, step_type));
      const parts = await Promise.all(promises);

      return new Response(JSON.stringify({ content: parts.join('\n\n---\n\n') }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // A. Global Steps (Course Level) — handled by handleLegacyStep (no module_id required)
    // Per-module deliverables (workbook, manual, slides, exercises, etc.) go to handleGoldenStep.
    const GLOBAL_STEPS = [
  'course.steps.structure',
  'structure',
  'course_dna',
  'course.steps.performance_objectives',
  'performance_objectives',
  'course.steps.course_objectives',
  'course_objectives',
  'course.steps.timing_and_flow',
  'timing_and_flow',
  'course.steps.learning_methods',
  'learning_methods',
  'course.steps.macro_structure',
  'course_macro_structure',
  'course.steps.course_slides',
  'course_slides',
  'agenda_table',
  'course.steps.agenda_table',
  'discussion_guide',
  'course.steps.discussion_guide',
  'action_plan',
  'course.steps.action_plan',
  'diagnostic_questionnaire',
  'course.steps.diagnostic_questionnaire',
  'cheat_sheets',
  'projects',
  'tests'
];

    if (GLOBAL_STEPS.includes(step_type)) {
       result = await handleLegacyStep(supabase, course, step_type, context, blueprint_duration, explicit_module_list, useContractPipeline);
    } 
    // B. Golden Path (Module Level Content)
    else {
      if (!module_id) {
         throw new Error(`[CRITICAL] module_id is required for step '${step_type}'. Frontend must provide it.`);
      }
      result = await handleGoldenStep(supabase, course, module_id, step_type);
    }

    return new Response(JSON.stringify({ content: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    Logger.error("Main Handler Error", error);
    
    // Return 200 with error details to allow client to display the message
    // instead of a generic 500 FunctionsHttpError
    return new Response(JSON.stringify({ 
      error: error.message || "An unexpected error occurred",
      details: error.stack,
      context: "Main Handler Catch"
    }), {
      status: 200, // Intentional 200 to bypass Edge Function 500 trap
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ==========================================
// 7. BUSINESS LOGIC HANDLERS
// ==========================================

function hasMinimalCourseDNA(course: Course): boolean {
  const dna = course.dna;
  if (!dna) return false;

  const participantTerm = dna.terminology?.participant;
  const lang = String(course.language || '').trim();

  if (!participantTerm || String(participantTerm).trim().length === 0) {
    return false;
  }

  if (!lang) {
    return false;
  }

  return true;
}

function buildMandatoryContext(course: Course): string {
  const title = course.title || "Untitled Course";
  const audience = course.target_audience || "General Audience";
  const environment = course.environment || "LIVE";
  const objectives = course.learning_objectives || "Not specified.";
  const lang = course.language || "Romanian";
  
  // Calculate module count safely
  let moduleCount = 0;
  if (course.blueprint && Array.isArray(course.blueprint.modules)) {
      moduleCount = course.blueprint.modules.length;
  }
  
  let moduleListStr = "";
  if (course.blueprint && Array.isArray(course.blueprint.modules)) {
      moduleListStr = course.blueprint.modules.map((m: any, i: number) => `${i + 1}. ${m.title}`).join('\n');
  }

  // Use ENGLISH for meta-labels (LLM instructions), but the content variables are passed as is.
  // The LLM is instructed to generate output in the Target Language.
  return `
=== MANDATORY COURSE CONTEXT ===
1. Course Title: ${title}
2. Target Language: ${lang}
3. Target Audience: ${audience}
4. Delivery Environment: ${environment}
5. Module Count: ${moduleCount}
6. Module List:
${moduleListStr}
7. Learning Objectives:
${objectives}
================================
`.trim();
}

function extractModulesFromMarkdown(markdown: string): string[] {
  const modules: string[] = [];
  const sectionMatch = markdown.match(/###\s*MODULE_LIST_BEGIN\s*\n([\s\S]*?)\n\s*###\s*MODULE_LIST_END/);
  if (!sectionMatch) {
    Logger.warn('[extractModulesFromMarkdown] MODULE_LIST section not found. No modules extracted.');
    return modules;
  }
  const listSection = sectionMatch[1];
  const lines = listSection.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*\d+[\.\)]\s+(.+)$/);
    if (match) {
      const title = match[1].replace(/\*\*/g, '').replace(/\*/g, '').trim();
      if (title.length > 2) {
        modules.push(title);
      }
    }
  }
  Logger.info(`[extractModulesFromMarkdown] Extracted ${modules.length} modules from MODULE_LIST section.`);
  return modules;
}

function isValidGoldenData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // 1. Check Root Fields
  // Note: localizedLabels is checked separately and patched if missing, so we don't fail validation for it.
  const required = ['moduleId', 'moduleTitle', 'moduleDurationMinutes', 'environment', 'narrativeContext', 'sections'];
  for (const field of required) {
    if (!(field in data)) {
      Logger.warn(`[Validation] Missing required field: ${field}`);
      return false;
    }
  }
  
  // 2. Check Narrative Context
  if (!data.narrativeContext || typeof data.narrativeContext !== 'object') {
    Logger.warn("[Validation] narrativeContext is missing or invalid");
    return false;
  }
  
  // 3. Check Sections
  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    Logger.warn("[Validation] sections is missing or empty");
    return false;
  }
  
  return true;
}

function getLivrableDbKey(stepType: string): string | null {
  const s = stepType.toLowerCase();
  if (s.includes('workbook')) return 'course.livrables.participant_workbook';
  if (s.includes('slides')) return 'course.livrables.slides';
  if (s.includes('manual') || s.includes('facilitator_notes')) return 'course.livrables.trainer_manual';
  if (s.includes('exercises')) return 'course.livrables.exercises';
  if (s.includes('video_scripts') || s.includes('video_script')) return 'course.livrables.video_scripts';
  if (s.includes('examples')) return 'course.livrables.examples';
  return null;
}

async function handleGoldenStep(
  supabase: any,
  course: Course,
  module_id: string,
  step_type: string
): Promise<string> {

  const { data: moduleData, error: moduleError } = await supabase
    .from('course_modules')
    .select('*')
    .eq('id', module_id)
    .single();

  if (moduleError || !moduleData) throw new Error(`Module not found: ${module_id}`);

  if (!hasMinimalCourseDNA(course)) {
    Logger.warn('[GoldenStep] Course DNA is incomplete. Materials may be generic.', {
      courseId: course.id,
      hasDna: !!course.dna
    });
  }

  // Step 1: Get or generate ModuleContext (lightweight structural blueprint, cached in content_data)
  const isDirty = (moduleData as any).is_dirty === true;
  let moduleContext: ModuleContext | null = isValidModuleContext(moduleData.content_data)
    ? moduleData.content_data
    : null;

  if (!moduleContext || isDirty) {
    Logger.info(`[GoldenStep] ${isDirty ? 'Dirty flag set' : 'No valid ModuleContext'}. Generating for module: ${moduleData.title}`);
    moduleContext = await generateModuleContext(supabase, course, moduleData);
    await supabase
      .from('course_modules')
      .update({ content_data: moduleContext, is_dirty: false })
      .eq('id', module_id);
    Logger.info(`[GoldenStep] ModuleContext saved for module: ${moduleData.title}`);
  } else {
    Logger.info(`[GoldenStep] Reusing cached ModuleContext for module: ${moduleData.title}`);
  }

  // Step 3.5: If module is not dirty, check if we can reuse the existing step content segment
  if (!isDirty) {
    const dbKey = getLivrableDbKey(step_type);
    if (dbKey) {
      try {
        const { data: stepRow, error: stepRowError } = await supabase
          .from('course_steps')
          .select('content')
          .eq('course_id', course.id)
          .eq('title_key', dbKey)
          .maybeSingle();

        if (!stepRowError && stepRow && stepRow.content) {
          const parts = stepRow.content.split('\n\n---\n\n');
          let partIndex = moduleData.module_index;
          if (dbKey === 'course.livrables.participant_workbook') {
            partIndex = moduleData.module_index + 1;
          }

          const existingPart = parts[partIndex];
          if (existingPart && existingPart.trim().length > 0 && !existingPart.includes('Content generation failed') && !existingPart.includes('Slides generation failed')) {
            Logger.info(`[handleGoldenStep] Reusing cached segment for module ${moduleData.title} in step ${step_type}`);
            return existingPart;
          }
        }
      } catch (err) {
        Logger.warn('[handleGoldenStep] Cache reuse check failed.', err);
      }
    }
  }

  // Step 4: Build DNA blocks for prompt injection
  const dna = buildDNABlocks(course);

  // Step 4.5: Check if lessons exist in the database for this module to run granular generation
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('module_id', module_id)
    .order('order_index');

  if (!lessonsError && lessons && lessons.length > 0) {
    Logger.info(`[handleGoldenStep] Found ${lessons.length} lessons. Generating granular content for step: ${step_type}`);
    const parts: string[] = [];
    for (const lesson of lessons) {
      const content = await generateLessonContent(supabase, lesson.id, step_type);
      parts.push(content);
    }
    // XML slides should be joined without Markdown dividers if preferred, but \n\n---\n\n works for all, slides parser handles separators too
    return parts.join('\n\n---\n\n');
  }

  // Step 5: Generate the requested deliverable with a specialized prompt
  Logger.info(`[GoldenStep] Generating deliverable '${step_type}' for module ${module_id}`);

  switch (step_type) {
    case 'course.steps.workbook':
    case 'participant_workbook':
      return generateWorkbookContent(course, moduleContext, dna);

    case 'course.steps.manual':
    case 'facilitator_manual':
    case 'trainer_manual':
    case 'facilitator_notes': // facilitator_notes is a subset of the full manual
      return generateManualContent(course, moduleContext, dna, true, supabase);

    case 'course.steps.slides':
    case 'slides':
      return generateSlidesContent(course, moduleContext, dna, supabase);

    case 'course.steps.exercises':
    case 'exercises':
      return generateExercisesContent(course, moduleContext, dna);

    case 'course.steps.video_scripts':
    case 'video_scripts':
      return generateVideoScriptContent(course, moduleContext, dna);

    case 'course.steps.examples':
    case 'examples_and_stories':
      return generateExamplesContent(course, moduleContext, dna);

    default:
      Logger.warn(`[GoldenStep] Unknown step_type '${step_type}', falling back to workbook.`);
      return generateWorkbookContent(course, moduleContext, dna);
  }
}

async function buildKnowledgeBaseContext(
  supabase: any,
  courseId: string,
  language: string,
  maxFiles: number = 4,
  maxCharsPerFile: number = 2000
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('course_files')
      .select('filename, extracted_text, uploaded_at')
      .eq('course_id', courseId)
      .order('uploaded_at', { ascending: false })
      .limit(maxFiles);
    
    if (error || !data || data.length === 0) {
      return '';
    }

    const pieces: string[] = [];
    for (const f of data) {
      const title = f.filename || 'File';
      const text = String(f.extracted_text || '').trim();
      if (!text) continue;
      const truncated = text.length > maxCharsPerFile ? text.slice(0, maxCharsPerFile) + '...' : text;
      pieces.push(`- ${title}: ${truncated}`);
    }

    if (pieces.length === 0) return '';

    // Instruction is in English (System Language), but directs behavior for the Target Language.
    const guidance = `Use the context below to align examples, terminology and scenarios. Avoid contradictions. Target Language: ${language}`;

    return `${guidance}\n${pieces.join('\n')}`;
  } catch (e) {
    Logger.warn('Failed to build Knowledge Base Context', e);
    return '';
  }
}
async function handleLegacyStep(
  supabase: any, 
  course: Course, 
  step_type: string, 
  context: any,
  blueprintDuration: string = "8 hours",
  explicitModuleList: string = "",
  useContractPipeline: boolean = false
): Promise<string> {
  

  if (useContractPipeline && ['facilitator_notes', 'facilitator_manual', 'trainer_manual', 'course.steps.manual'].includes(step_type)) {
    const modules = course.blueprint?.modules;
    if (!modules || modules.length === 0) {
      Logger.warn(`[LegacyStep][ContractPipeline] No blueprint modules for step_type=${step_type}. Falling back to generic manual prompt.`);
      return await callLLM(`Generate ${step_type} content for course "${course.title}". Language: ${course.language || 'ro'}.`, course.language || 'ro');
    }

    const stepKeyMap: Record<string, string> = {
      'facilitator_notes': 'course.steps.manual',
      'facilitator_manual': 'course.steps.manual',
      'trainer_manual': 'course.steps.manual',
      'course.steps.manual': 'course.steps.manual',
    };
    const goldenStepKey = stepKeyMap[step_type] || 'course.steps.manual';
    Logger.info(`[LegacyStep][ContractPipeline] Routing ${step_type} through Golden per-module generation. Modules: ${modules.length}, step_key: ${goldenStepKey}`);
    const results: string[] = [];
    for (let i = 0; i < modules.length; i++) {
      const moduleId = await resolveModuleId(supabase, course.id, modules[i], i);
      const content = await handleGoldenStep(supabase, course, moduleId, goldenStepKey);
      results.push(content);
    }
    return results.join('\n\n---\n\n');
  }

  if (step_type === 'course_dna') {
      // T5: Build knowledge base context
      const knowledgeBase = await buildKnowledgeBaseContext(supabase, course.id, course.language || 'ro');
      const kbBlock = knowledgeBase ? `\n### UPLOADED REFERENCE MATERIALS\n${knowledgeBase}\nUse these to populate domainContext fields.` : '';

      const prompt = `
      **TASK**: Create the "Course DNA" - the stylistic and pedagogical "soul" of the course.
      **COURSE**: "${course.title}"
      **TARGET AUDIENCE**: "${course.target_audience}"
      **ENVIRONMENT**: ${course.environment}
      **LANGUAGE**: ${course.language || "Romanian"}
      **TIMING**: Total course duration is ${blueprintDuration}.
      ${kbBlock}
      
      **GOAL**: Define the terminology and the author's authentic voice for this course.

      **OUTPUT FORMAT**:
      Strict JSON object with this structure:
      {
        "terminology": {
          "participant": "Term for learner (e.g. Participant, Student, Explorer)",
          "exercise": "Term for activity (e.g. Exercise, Challenge, Mission)",
          "trainer": "Term for instructor (e.g. Trainer, Facilitator, Guide)",
          "mandatoryTerms": {},
          "forbiddenPhrases": []
        },
        "toneFreeText": "A short paragraph, in the author's own words, describing how they sound: formality, warmth, humor, any signature phrasing. Written in ${course.language || "Romanian"}.",
        "domainContext": {
          "industryTerms": { "term": "definition" },
          "clientProfiles": [{ "type": "...", "decisionLogic": "...", "approach": "..." }],
          "productCatalog": [{ "category": "...", "items": ["..."] }],
          "competitorIntelligence": [{ "name": "...", "weaknesses": [...], "counterStrategy": "..." }],
          "negotiationFrameworks": [{ "name": "...", "steps": [...] }]
        }
      }

      **IMPORTANT**: Return ONLY valid JSON. The content MUST be in ${course.language || "Romanian"}.
      Populate domainContext ONLY from the reference materials above. If no materials are provided, leave arrays empty.
      `;
      
      try {
        Logger.info(`[LegacyStep] Invoking LLM for CourseDNA...`);
        const response = await callLLM(prompt, course.language || 'ro');
        Logger.info(`[LegacyStep] CourseDNA LLM Response received (length: ${response.length})`);
        return response;
      } catch (e: any) {
        Logger.error(`[LegacyStep] CourseDNA LLM Failed:`, e);
        
        // Soft Fallback to prevent Edge Function timeout/crash from killing the UI flow
        const isRo = (course.language || 'ro').toLowerCase().startsWith('ro');
        return JSON.stringify({
          terminology: {
            participant: isRo ? "Participant" : "Participant",
            exercise: isRo ? "Exercițiu" : "Exercise",
            trainer: isRo ? "Trainer" : "Trainer",
            mandatoryTerms: {},
            forbiddenPhrases: []
          },
          toneFreeText: isRo ? "Profesional, clar și încurajator." : "Professional, clear and encouraging.",
          domainContext: {
            industryTerms: {},
            clientProfiles: [],
            productCatalog: [],
            competitorIntelligence: [],
            negotiationFrameworks: []
          }
        });
      }
  }

  if (step_type === 'course.steps.structure' || step_type === 'structure') {
     let modulesList = "";
     if (!explicitModuleList || String(explicitModuleList).trim().length === 0) {
       const mods = (course.blueprint && Array.isArray(course.blueprint.modules)) ? course.blueprint.modules : [];
       if (mods.length > 0) {
         const lines = mods.map((m: any, i: number) => `${i + 1}. ${m.title}`).join('\n');
         modulesList = `\n${lines}\n`;
       }
     }
     const approvedObjectives = String((course as any).learning_objectives || '').trim();
     const lang = course.language || "Romanian";
     
     const blueprintBlock = (explicitModuleList && String(explicitModuleList).trim().length > 0)
       ? `\n**APPROVED BLUEPRINT (supreme source of truth)**:\n${explicitModuleList}\n`
       : (modulesList ? `\n**APPROVED BLUEPRINT (supreme source of truth)**:\n${modulesList}\n` : '');
     const objectivesBlock = approvedObjectives
       ? `\n**User-approved objectives**:\n${approvedObjectives}\n`
       : '';
     
     const envConstraint = (course.environment || 'LIVE').toUpperCase() === 'ONLINE'
        ? "ONLINE (VIRTUAL)"
        : "LIVE (IN-PERSON)";

     const prompt = `
        **TASK**: Design the Course Structure & Agenda.
        **TARGET LANGUAGE**: ${lang} (ALL OUTPUT MUST BE IN THIS LANGUAGE)
        **ENVIRONMENT**: ${envConstraint}
        ${blueprintBlock}${objectivesBlock}
        
        **INSTRUCTIONS**:
        1. Generate exactly 4-6 concise objectives in the form "By the end, participants will be able to..." (translated to ${lang}).
        2. **GOLDEN RULE**: If specific data is missing, INVENT realistic and plausible values for the context (e.g., "15% increase" not "X% increase"). Be concrete. NO PLACEHOLDERS like "X%", "Y dollars".
        3. Build the minute-by-minute agenda table.
        4. Respect the environment constraints (e.g. Breakout Rooms for Online, Physical activities for Live).
        
        **CONSTRAINTS**:
        - Do not exceed 1000 words.
        - No introductions or conclusions.
        - Telegraphic style, 1-2 sentences per cell.
        - Each agenda row must support at least one objective.
        - Use 10-30 minute blocks.
        - **STRICTLY FORBIDDEN**: Never use placeholders like "X%", "Y dollars", "Z clients".

        **OUTPUT FORMAT**:
        Return ONLY Markdown.
        
        # [Course Title in ${lang}]
        
        ### [Objectives Header in ${lang}]
        - ...
        - ...
        
        ### [Agenda Header in ${lang}]
        | Time | Topic | Method | Material | Trainer Action | Activity Objective | Participant Action | On-the-job Benefit |
        | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
        | 09:00 - 09:15 | [Topic in ${lang}] | [Method in ${lang}] | [Material in ${lang}] | ... | ... | ... | ... |

        ### MODULE_LIST_BEGIN
        (List ONLY the main educational modules, numbered. 
        Do NOT include breaks, lunch, intro/outro, or recap items.
        Write each title in ${lang}.)
        1. [Educational Module Title 1]
        2. [Educational Module Title 2]
        3. [Educational Module Title 3]
        ### MODULE_LIST_END
     `;
     
     const rawResponse = await callLLM(prompt, course.language || 'ro');

     // EXTRACT AND SAVE MODULES
     // FIX: Only extract modules if blueprint is empty. Do NOT overwrite existing verified blueprint with Agenda items.
     // forceRegenerateModules can be sent from frontend when user explicitly
     // requests a full structure regeneration (e.g. "Start Over" button)
     const forceRegenerateModules = explicitModuleList && String(explicitModuleList).trim().length > 0;
     const hasExistingModules = !forceRegenerateModules && 
       course.blueprint && 
       Array.isArray(course.blueprint.modules) && 
       course.blueprint.modules.length > 0;
     
     if (!hasExistingModules) {
         try {
            const extractedModules = extractModulesFromMarkdown(rawResponse);

            if (extractedModules.length > 0) {
              Logger.info(`Extracted ${extractedModules.length} modules from generated Agenda. Updating Blueprint (was empty)...`);
              
              const currentBlueprint = course.blueprint || {};
              // Map to minimal module structure
              const newModules = extractedModules.map(title => ({ 
                title, 
                sections: [], // Initialize empty sections
                duration: "45 min" // Default
              }));
              
              const updatedBlueprint = {
                ...currentBlueprint,
                modules: newModules
              };

              // Update DB
              await supabase
                .from('courses')
                .update({ blueprint: updatedBlueprint })
                .eq('id', course.id);
                
              // Update local course object reference just in case
              course.blueprint = updatedBlueprint;
            } else {
              Logger.warn("Could not extract modules from Agenda markdown.");
            }
         } catch (e) {
           Logger.error("Failed to extract/save modules from Agenda", e);
         }
     } else {
        Logger.info(`Skipping module extraction from Agenda because Blueprint already has ${course.blueprint?.modules?.length || 0} modules.`);
     }

     return rawResponse; // Return Markdown directly
  }

  if (step_type === 'course.steps.performance_objectives' || step_type === 'performance_objectives') {
    const safeTitle = course.title || "Untitled Course";
    const safeLang = course.language || 'ro';
    
    const prompt = `
    **TASK**: Define 5-7 High-Level Performance Objectives.
    **COURSE**: "${safeTitle}"
    **LANGUAGE**: ${safeLang}
    
    **CONSTRAINT**: 
    - Output EXACTLY 5-7 bullet points.
    - Be concise and action-oriented.
    - NO introductory text. NO closing text.
    - DO NOT categorize (e.g. Verbal, Non-verbal). Just a single list of the most critical skills.
    `;
    
    try {
      const result = await callLLM(prompt, safeLang);
      if (!result || result.trim().length === 0) {
         throw new Error("Empty response from LLM for performance objectives");
      }
      return result;
    } catch (error) {
       Logger.error("Failed to generate performance objectives", error);
       // Fallback to prevent runtime crash
       return `- Identify key components of the subject\n- Apply core principles in daily tasks\n- Demonstrate understanding of safety protocols\n- Evaluate process efficiency\n- Create actionable improvement plans`;
    }
  }

  if (step_type === 'course.steps.course_objectives' || step_type === 'course_objectives') {
    const prompt = `
    **TASK**: Write a concise Course Goal Statement.
    **COURSE**: "${course.title}"
    **LANGUAGE**: ${course.language}
    
    **CONSTRAINT**: 
    - Output a single paragraph (max 3-4 sentences) summarizing the main goal.
    - NO bullet points.
    - NO repetition of performance objectives.
    `;
    return await callLLM(prompt, course.language || 'ro');
  }

  if (step_type === 'course.steps.timing_and_flow' || step_type === 'timing_and_flow') {
      const prompt = `
      **TASK**: Provide brief Pacing & Flow Tips.
      **COURSE**: "${course.title}"
      **LANGUAGE**: ${course.language}
      
      **CONSTRAINT**: 
      - Max 3-5 tips on how to manage the energy and flow of this course.
      - Do NOT repeat the agenda/schedule.
      `;
      return await callLLM(prompt, course.language || 'ro');
  }

  if (step_type === 'course.steps.learning_methods' || step_type === 'learning_methods') {
      const prompt = `
      **TASK**: Suggest appropriate Learning Methods & Delivery Strategies.
      **COURSE**: "${course.title}"
      **TARGET AUDIENCE**: "${course.target_audience}"
      **LANGUAGE**: ${course.language}

      **CONSTRAINT**:
      - Recommend 3-5 specific teaching methods (e.g., Case Studies, Role Play, Direct Instruction) suitable for this content.
      - Briefly explain why each is effective for this audience.
      `;
      return await callLLM(prompt, course.language || 'ro');
  }

  // --- GOLDEN PATH FOR MODULE-LEVEL STEPS ---
  // These step types require per-module generation via the Golden JSON approach.
  // Processing them through the generic callLLM fallback can cause routing ambiguity
  // and produces inferior content. We explicitly iterate modules here.
  if (['exercises', 'examples_and_stories', 'facilitator_notes', 'facilitator_manual'].includes(step_type)) {
    const modules = course.blueprint?.modules;
    if (!modules || modules.length === 0) {
      Logger.warn(`[handleLegacyStep] No blueprint modules for step_type=${step_type}. Using generic fallback.`);
      return await callLLM(`Generate ${step_type} content for course "${course.title}". Language: ${course.language || 'ro'}.`, course.language || 'ro');
    }
    const stepKeyMap: Record<string, string> = {
      'exercises': 'course.steps.exercises',
      'examples_and_stories': 'course.steps.examples',
      'facilitator_notes': 'course.steps.manual',
      'facilitator_manual': 'course.steps.manual',
    };
    const goldenStepKey = stepKeyMap[step_type] || 'course.steps.exercises';
    Logger.info(`[handleLegacyStep] Processing ${step_type} as Golden per-module. Modules: ${modules.length}, step_key: ${goldenStepKey}`);
    const results: string[] = [];
    for (let i = 0; i < modules.length; i++) {
      const moduleId = await resolveModuleId(supabase, course.id, modules[i], i);
      const content = await handleGoldenStep(supabase, course, moduleId, goldenStepKey);
      results.push(content);
    }
    return results.join('\n\n---\n\n');
  }

  if (step_type === 'course.steps.course_slides' || step_type === 'slides') {
      let moduleListStr = "";
      if (course.blueprint && Array.isArray(course.blueprint.modules)) {
          moduleListStr = course.blueprint.modules.map((m: any, i: number) => `${i + 1}. ${m.title}`).join('\n');
      }

      const prompt = `
      **TASK**: Create a Course Kick-off Presentation (Slide Deck).
      **COURSE**: "${course.title}"
      **TARGET LANGUAGE**: ${course.language} (ALL OUTPUT MUST BE IN THIS LANGUAGE)
      **CONTEXT**: ${course.description}
      
      **COURSE OUTLINE (MODULES)**:
      ${moduleListStr}

      **GOAL**: A sequence of 8-12 slides to introduce the course, objectives, and structure to the participants.
      
      **OUTPUT FORMAT**: 
      Markdown with clear slide delimiters.
      
      **TEMPLATE PER SLIDE**:
      ## Slide [N]: [Title in ${course.language}]
      **Visual Description:** [Instruction for designer/AI in English or ${course.language}]
      **Key Points:**
      - [Bullet 1 in ${course.language}]
      - [Bullet 2 in ${course.language}]
      - [Bullet 3 in ${course.language}]
      **Speaker Notes:** [What the trainer says - conversational and engaging in ${course.language}]
      
      **REQUIRED SLIDES**:
      1. Title Slide
      2. Welcome & Icebreaker
      3. Why this course? (WIIFM - What's in it for me?)
      4. Key Learning Objectives (Summarized)
      5. High-level Agenda/Roadmap (Use the COURSE OUTLINE provided above)
      6. Rules of Engagement / Logistics
      7-11. Brief intro to key modules (1 slide per major topic from the OUTLINE)
      12. Closing & Q&A
      `;
      return await callLLM(prompt);
  }

  if (step_type === 'course_macro_structure' || step_type === 'course.steps.macro_structure') {
      // No AI-authored master timeline anymore (F3-T1 removed CourseDNA.masterTimeline,
      // which was never editable in the DNA UI) — always derive from the blueprint.
      const masterTimeline = {
          totalDuration: parseInt(blueprintDuration) * 60 || 480,
          bufferPerModule: 10,
          modules: (course.blueprint?.modules || []).map((m: any, i: number) => ({
              id: `module-${i+1}`,
              title: m.title,
              duration: 45
          }))
      };

      const prompt = `
      **TASK**: Create the Course Macro Structure (High-Level Schedule).
      **COURSE**: "${course.title}"
      **TOTAL DURATION**: ${masterTimeline.totalDuration} minutes
      **MODULES**: ${JSON.stringify(masterTimeline.modules)}
      **ENVIRONMENT**: ${course.environment}
      **LANGUAGE**: ${course.language || "Romanian"}

      **GOAL**: Organize the course into a coherent flow with Intro, Content Blocks, Breaks, and Wrap-up.

      **OUTPUT FORMAT**:
      Strict JSON object:
      {
        "macroBlocks": [
          { "type": "INTRO", "duration": 20, "title": "Welcome & Icebreaker" },
          { "type": "CONTENT_BLOCK", "duration": 60, "moduleRef": "module-1", "title": "Module 1 Title" },
          { "type": "BREAK", "duration": 15, "purpose": "Coffee Break" },
          ...
          { "type": "WRAP_UP", "duration": 30, "title": "Final Review & Action Plan" }
        ]
      }

      **RULES**:
      1. 'type' must be one of: 'INTRO', 'CONTENT_BLOCK', 'BREAK', 'WRAP_UP'.
      2. 'moduleRef' is the ID of the module from the provided list (only for CONTENT_BLOCK).
      3. Total duration must match ${masterTimeline.totalDuration} minutes (+/- 10%).
      4. Insert breaks every 60-90 minutes.
      5. Titles must be in ${course.language || "Romanian"}.
      `;

      try {
        const response = await callLLM(prompt, course.language || 'ro');
        const json = repairAndParseJson<any>(response);
        
        // Save to DB
        const { error } = await supabase
          .from('courses')
          .update({ macro_plan: json })
          .eq('id', course.id);

        if (error) {
            Logger.error("Failed to save macro_plan to DB", error);
        } else {
            Logger.info("Successfully saved macro_plan to DB");
        }

        return JSON.stringify(json, null, 2);
      } catch (e) {
          Logger.error("Failed to generate/parse macro structure", e);
          return JSON.stringify({ error: "Failed to generate macro structure" });
      }
  }

  if (step_type === 'facilitator_manual' || step_type === 'trainer_manual') {
      const mandatoryContext = buildMandatoryContext(course);
      const modules = (course.blueprint && Array.isArray(course.blueprint.modules)) ? course.blueprint.modules : [];
      const moduleList = modules.map((m: any, i: number) => `${i + 1}. ${m.title} (${m.duration || '45 min'})`).join('\n');
      
      // Extract DNA for Voice & Terminology
      const dna = course.dna || {};
      const terminology = dna.terminology || {};

      let dnaContext = "";
      if (terminology.participant || terminology.trainer) {
          dnaContext += `\n**TERMINOLOGY**:\n- Participant: ${terminology.participant || "Participant"}\n- Trainer: ${terminology.trainer || "Trainer"}\n`;
      }
      dnaContext += `\n**VOICE**: ${dna.toneFreeText || "Professional, clear and encouraging."}\n`;

      const prompt = `
      **TASK**: Create a Comprehensive Facilitator Manual (Trainer Guide).
      **COURSE**: "${course.title}"
      **TARGET AUDIENCE**: "${course.target_audience}"
      **LANGUAGE**: ${course.language || 'Romanian'} (STRICT)
      **ENVIRONMENT**: ${course.environment || 'LIVE'}

      ${mandatoryContext}
      ${dnaContext}

      **COURSE MODULES**:
      ${moduleList}

      **GOAL**: 
      Provide a professional, step-by-step guide for the trainer to deliver this course effectively.
      The tone should be DIRECTIVE (imperative), CLEAR, and ENCOURAGING.
      
      **STRUCTURE**:
      1. **Course Overview**: Objectives, Target Audience, Total Duration.
      2. **Logistics & Prep**: Room setup, materials needed, technical checks.
      3. **Trainer Tips**: Key facilitation principles for this specific audience.
      4. **Module-by-Module Guide**:
         - For each module in the list above, provide:
           - **Key Concepts**: What to explain.
           - **Activity Instructions**: How to run the exercises (Step-by-step).
           - **Debrief Questions**: Specific questions to ask the group.
           - **Transitions**: How to move to the next topic.

      **CRITICAL RULES**:
      1. **LANGUAGE**: ALL content (titles, instructions, questions) MUST be in ${course.language || 'Romanian'}. 
         - DO NOT mix languages. 
         - Use the defined Terminology.
      2. **QUALITY**: 
         - **NO WEIRD EXPLANATIONS**. Do not say "Here you should explain...". Instead say: "Explain that..." or "Ask the group...".
         - Use IMPERATIVE verbs: "Write", "Ask", "Divide", "Show".
         - Avoid generic advice like "Facilitate a discussion". Instead, say "Ask Q1, wait 2 mins, then list answers on flipchart".
      3. **FORMAT**: Markdown. Use bolding and lists for readability.
      `;

      return await callLLM(prompt, course.language || 'ro');
  }

  // ============================================================
  // NEW MATERIALS — Inspired by real-world course reference
  // ============================================================

  if (step_type === 'discussion_guide') {
      const mandatoryContext = buildMandatoryContext(course);
      const modules = (course.blueprint && Array.isArray(course.blueprint.modules)) ? course.blueprint.modules : [];
      const moduleList = modules.map((m: any, i: number) => `${i + 1}. ${m.title}`).join('\n');
      const dna = course.dna || {};

      const prompt = `
      **TASK**: Create a "Discussion Guide" — a facilitation cheat sheet with one Hook Question and one Key Takeaway for each course module.
      **COURSE**: "${course.title}"
      **TARGET AUDIENCE**: "${course.target_audience}"
      **LANGUAGE**: ${course.language || 'Romanian'} (STRICT — every word)
      **VOICE**: ${dna.toneFreeText || 'Professional, clear and encouraging.'}

      ${mandatoryContext}

      **MODULES**:
      ${moduleList}

      **GOAL**:
      For each module, generate:
      1. A **Hook Question** — an open, provocative question that GRABS attention before explaining the theory. NOT "What is X?", but "When was the last time you felt misunderstood at work?"
      2. A **Key Takeaway** — 1-2 sentences that summarize the core insight participants should leave with.

      **PEDAGOGICAL RULES**:
      - Hook questions must be experiential — they refer to real situations the audience has lived through.
      - Key takeaways must be actionable — not "we learned about X", but "next time Y happens, do Z".
      - Avoid generic statements. Be SPECIFIC to the course topic and audience context.
      - Use simple, non-academic language appropriate for the audience.

      **OUTPUT FORMAT**:
      A markdown table with 3 columns, headers translated into ${course.language || 'Romanian'}: | Module | Hook Question | Key Takeaway |
      One row per module. Then below the table, for each module, also provide a short 2-3 bullet "Debrief Script" — what to say right after the activity.

      **CRITICAL**: Output ONLY in ${course.language || 'Romanian'}. No English words.
      `;
      return await callLLM(prompt, course.language || 'ro');
  }

  if (step_type === 'action_plan') {
      const mandatoryContext = buildMandatoryContext(course);
      const objectives = (context || '').slice(0, 500);
      const dna = course.dna || {};
      const terminology = dna.terminology || {};

      const prompt = `
      **TASK**: Create a personal "Action Plan" template — a take-home sheet that participants fill in at the end of the course.
      **COURSE**: "${course.title}"
      **TARGET AUDIENCE**: "${course.target_audience}"
      **LANGUAGE**: ${course.language || 'Romanian'} (STRICT)
      **PARTICIPANT TERM**: ${terminology.participant || 'Participant'}

      ${mandatoryContext}

      **CONTEXT** (Course Objectives): ${objectives || 'See course title.'}

      **GOAL**:
      Create a structured, printable action plan that each participant completes individually at the end of the session.
      This document will be taken home and discussed with their manager.

      **REQUIRED SECTIONS**:
      1. **Header**: Course title, participant name (blank field), date.
      2. **Top 3 Insights**: 3 blank lines for the most valuable ideas from the course.
      3. **Skills to Improve**: A table with columns: Skill | Current Level (1-5) | Target Level (1-5) | First Step
      4. **30-Day Commitment**: 1 specific, measurable action to take in the next 30 days.
         - Format: "I will [action] by [date] and I will measure success by [metric]."
      5. **Support Needed**: What help or resources do I need from my manager/team?
      6. **Manager Discussion Box**: A dedicated box for the manager to sign and comment after reviewing.

      **FORMATTING RULES**:
      - Use clear markdown. Headers, tables, blank lines for writing.
      - Keep language simple and direct. This is a PRACTICAL document, not a test.
      - Tone should be encouraging, not bureaucratic.
      - Output ONLY in ${course.language || 'Romanian'}.
      `;
      return await callLLM(prompt, course.language || 'ro');
  }

  if (step_type === 'diagnostic_questionnaire') {
      const mandatoryContext = buildMandatoryContext(course);
      const dna = course.dna || {};
      const terminology = dna.terminology || {};

      const prompt = `
      **TASK**: Create a pre-course "Diagnostic Questionnaire" — a self-assessment tool given to participants BEFORE the training starts.
      **COURSE**: "${course.title}"
      **TARGET AUDIENCE**: "${course.target_audience}"
      **LANGUAGE**: ${course.language || 'Romanian'} (STRICT)
      **PARTICIPANT TERM**: ${terminology.participant || 'Participant'}

      ${mandatoryContext}

      **PURPOSE**:
      - Help participants reflect on their current skill level before training.
      - Provide the trainer with a quick read of the room.
      - Serve as a baseline for comparison at the end of the course.
      - The questionnaire is CONFIDENTIAL — no names required.

      **REQUIRED STRUCTURE**:
      1. **Instructions block**: Brief explanation (2-3 sentences) of how to complete it.
         - "Rate each statement from 1 (Never) to 5 (Always)."
         - "There are no wrong answers. Be honest."
         - "This is confidential and will not be shared."

      2. **15 Statements**: Each statement should directly probe a skill or behavior related to the course topic.
         - Format: A number, then a statement in first person. E.g. "1. I clearly express my ideas in team meetings."
         - IMPORTANT: Mix positively and negatively worded statements (5 should be inverted for scoring).
         - Mark inverted items with "(R)" at the end.
         - Statements must be concrete and behavioral, not vague.

      3. **Scoring Grid**: A simple calculation table.
         - Column A: Sum of normal items.
         - Column B: Sum of inverted items (subtract from 30).
         - Total Score = A + B.

      4. **Score Interpretation**: Three ranges with descriptions.
         - Low range (15-40): Description of what this means and what to focus on.
         - Medium range (41-60): Description.
         - High range (61-75): Description.

      5. **Footer note**: "At the end of the course, you will complete this again. Compare your scores!"

      **CRITICAL RULES**:
      - All 15 statements MUST be directly relevant to "${course.title}".
      - Language: simple, clear, first person.
      - Output ONLY in ${course.language || 'Romanian'}. No English.
      - Format: clean Markdown, printable.
      `;
      return await callLLM(prompt, course.language || 'ro');
  }

  if (step_type === 'agenda_table') {
      const mandatoryContext = buildMandatoryContext(course);
      const modules = (course.blueprint && Array.isArray(course.blueprint.modules)) ? course.blueprint.modules : [];
      const moduleList = modules.map((m: any, i: number) => {
          const sectionTitles = Array.isArray(m.sections) ? m.sections.map((s: any) => s.title).join(', ') : 'Activities';
          return `Module ${i + 1}: ${m.title} | Sections: ${sectionTitles}`;
      }).join('\n');
      // No AI-authored master timeline anymore (F3-T1) — total duration, when known,
      // comes from the blueprint's own estimate; otherwise the prompt asks the model
      // to infer it from the module list, same as before when masterTimeline was unset.
      const totalDuration = parseInt(blueprintDuration) * 60 || 0;

      const prompt = `
      **TASK**: Create a detailed "Training Agenda" — a structured, chronometric agenda table for the trainer to manage the session.
      **COURSE**: "${course.title}"
      **TARGET AUDIENCE**: "${course.target_audience}"
      **LANGUAGE**: ${course.language || 'Romanian'} (STRICT)
      **TOTAL DURATION**: ${totalDuration > 0 ? totalDuration + ' minutes' : 'To be determined based on modules'}

      ${mandatoryContext}

      **MODULES & SECTIONS**:
      ${moduleList || 'See course structure.'}

      **GOAL**:
      Produce a professional, print-ready training agenda table that the trainer can use as a reference during the session.

      **REQUIRED TABLE COLUMNS**:
      | Time | Module / Activity | Duration (min) | Key Message | Materials Needed | Notes for Trainer |

      **CONTENT RULES**:
      1. Start with a "Welcome & Introductions" block.
      2. For each module: include theory, activities, and debrief as separate rows.
      3. Include coffee breaks and lunch breaks where appropriate.
      4. End with a "Closing & Action Plans" block.
      5. Time column: use HH:MM format starting from 09:00 (or adjust if total duration suggests otherwise).
      6. "Key Message" = the ONE sentence that captures what participants should learn in this block.
      7. "Materials Needed" = list physical/digital materials: handouts, flip chart, markers, slides, etc.
      8. "Notes for Trainer" = brief tips: "Wait for silence", "Ask for volunteers", "Check energy level".

      **FORMATTING**:
      - Full markdown table.
      - Use bold for module headers.
      - Add a summary row at the bottom: Total Time, Total Breaks, Total Activities.
      - Output ONLY in ${course.language || 'Romanian'}.
      `;
      return await callLLM(prompt, course.language || 'ro');
  }


  const mandatoryContext = buildMandatoryContext(course);
  
  const prompt = `
    Generate content for ${step_type} for course "${course.title}".
    Language: ${course.language}.
    
    ${mandatoryContext}
    
    Context: ${context || "None"}.
  `;
  return await callLLM(prompt);
}

async function handleAnalyzeUpload(content: string, fileName: string, environment: string): Promise<string> {
  if (content.length < 100000) {
    const safeContent = content.substring(0, 100000);
    const prompt = `
    **TASK**: Analyze the uploaded course material and create a comprehensive Course Blueprint.
    **INPUT**: 
    File Name: ${fileName}
    Content Snippet: ${safeContent}
    Target Environment: ${environment}

    **GOAL**: Extract the structure and learning objectives to create a valid JSON Blueprint with modules and sections that can be used directly to generate course content.
    **IMPORTANT**: The output language MUST be the same as the INPUT content language. If the input is in Romanian, the JSON values (titles, descriptions, objectives) MUST be in Romanian.

    **OUTPUT FORMAT**:
    Strict JSON object with this structure:
    {
      "title": "Course Title",
      "target_audience": "Who is this for?",
      "description": "Course description",
      "modules": [
        {
          "title": "Module 1 Title",
          "duration": "45 min",
          "learning_objective": "By the end of this module, participants will...",
          "sections": [
            {
              "title": "Section 1 Title",
              "content_type": "theory | exercise | quiz | reflection | video_script | summary",
              "estimated_duration": "10-20 min",
              "goal": "What this section achieves"
            }
          ]
        }
      ]
    }
    
    Each module MUST have at least 3 sections with non-empty titles and content_type.
    Return ONLY valid JSON. Do not include markdown formatting.
    `;
    return await callLLM(prompt);
  }

  Logger.info(`Large document detected (${content.length} chars). Engaging Chunking Strategy.`);
  
  const CHUNK_SIZE = 50000; // ~12k tokens
  const chunks = [];
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.substring(i, i + CHUNK_SIZE));
  }

  // Limit chunks to avoid timeouts (max 20 chunks = 1M chars covered)
  // If > 20 chunks, we take first 5, middle 5, last 5
  let selectedChunks = chunks;
  if (chunks.length > 20) {
    const first = chunks.slice(0, 5);
    const last = chunks.slice(-5);
    const middleStart = Math.floor(chunks.length / 2) - 2;
    const middle = chunks.slice(middleStart, middleStart + 5);
    selectedChunks = [...first, ...middle, ...last];
    Logger.warn(`Document extremely large. Sampling ${selectedChunks.length} chunks out of ${chunks.length}.`);
  }

  // Step 1: Summarize Chunks (Parallel)
  const summarizePromises = selectedChunks.map(async (chunk, index) => {
    const chunkPrompt = `
      **TASK**: Analyze this segment (Part ${index + 1}) of a large course document.
      **GOAL**: Extract key pedagogical topics, potential module titles, and specific learning points.
      **CONTENT**: ${chunk.substring(0, 50000)}...

      **OUTPUT**: A concise bulleted summary. Focus on STRUCTURE and KEY CONCEPTS.
    `;
    try {
      return await callLLM(chunkPrompt);
    } catch (e) {
      Logger.error(`Failed to summarize chunk ${index}`, e);
      return ""; // Skip failed chunks
    }
  });

  const summaries = await Promise.all(summarizePromises);
  const masterSummary = summaries.join("\n\n=== NEXT SEGMENT ===\n\n");

  // Step 2: Final Blueprint Generation from Summaries
  const masterPrompt = `
    **TASK**: Create a Master Course Blueprint based on these document summaries.
    **INPUT**: 
    File Name: ${fileName}
    Target Environment: ${environment}
    
    **DOCUMENT SUMMARIES**:
    ${masterSummary}

    **GOAL**: Synthesize the summaries into a cohesive course structure.
    **IMPORTANT**: The output language MUST be the same as the INPUT content language.
    
    **OUTPUT FORMAT**:
    Strict JSON object with this structure:
    {
      "title": "Course Title",
      "target_audience": "Who is this for?",
      "description": "Course description",
      "modules": [
        {
          "title": "Module 1 Title",
          "duration": "45 min",
          "learning_objective": "By the end of this module, participants will...",
          "sections": [
            {
              "title": "Section 1 Title",
              "content_type": "theory | exercise | quiz | reflection | video_script | summary",
              "estimated_duration": "10-20 min",
              "goal": "What this section achieves"
            }
          ]
        }
      ]
    }
    
    Each module MUST have at least 3 sections with non-empty titles and content_type.
    Return ONLY valid JSON.
  `;

  return await callLLM(masterPrompt);
}

async function handleFillGaps(blueprint: any, existingContent: string, environment: string): Promise<string> {
    const prompt = `
    **TASK**: Identify content gaps in the imported course material based on the Blueprint and Target Environment.
    **ENVIRONMENT**: ${environment}
    **BLUEPRINT**: ${JSON.stringify(blueprint).substring(0, 5000)}
    **EXISTING CONTENT**: ${existingContent.substring(0, 5000)}... (truncated)

    **GOAL**: Recommend additional modules or content types that are missing but essential for a complete course in this environment.
    **IMPORTANT**: The output language MUST be the same as the INPUT content language.
    
    **OUTPUT**:
    Strict JSON object:
    {
      "gaps": [
        {
          "type": "quiz | exercise | summary | video_script",
          "description": "Description of what is missing and why it is needed."
        }
      ]
    }
    
    Return ONLY valid JSON.
    `;

    return await callLLM(prompt);
}

async function handleCompleteSectionsForImport(blueprint: any, environment: string, languageHint?: string): Promise<string> {
  const lang = languageHint || 'Romanian';
  const prompt = `
  **TASK**: Ensure that every module in the Course Blueprint has a well-defined list of sections.
  **ENVIRONMENT**: ${environment}
  **BLUEPRINT**: ${JSON.stringify(blueprint).substring(0, 5000)}

  **LANGUAGE INSTRUCTION**: 
  The provided Blueprint modules are likely in "${lang}". 
  HOWEVER, if they appear to be in another language, YOU MUST DETECT IT and generate the new content in that SAME language.
  Do not mix languages.

  **GOAL**:
  - For each module, if "sections" is missing, null or empty, generate 3-7 sections.
  - If sections exist but are incomplete, fix them (fill missing fields).

  Each section must have:
  - "title": concise, clear, in the detected language of the module
  - "content_type": one of "theory", "exercise", "quiz", "reflection", "video_script", "summary"
  - "estimated_duration": short text like "10-15 min"
  - "goal": what the participant will achieve in this section

  **OUTPUT FORMAT**:
  Return the full Blueprint JSON with the same top-level structure, but with modules[].sections[] completed as described above.

  Return ONLY valid JSON. Do not include markdown or explanations.
  `;

  return await callLLM(prompt);
}

const LOCALIZED_LABEL_KEYS = [
  'duration', 'format', 'section', 'theory', 'keyTakeaways', 'actionPlan', 'reflection',
  'trainerInstructions', 'method', 'logistics', 'script', 'activity', 'objective',
  'instructionsParticipant', 'instructionsFacilitator', 'debrief', 'example', 'videoScript',
] as const;

type LocalizedLabels = Record<typeof LOCALIZED_LABEL_KEYS[number], string>;

function getDefaultEnglishLabels(): LocalizedLabels {
  return {
    duration: 'Duration', format: 'Format', section: 'Section', theory: 'Theory & Concepts',
    keyTakeaways: 'Key Takeaways', actionPlan: 'Action Plan', reflection: 'Reflection',
    trainerInstructions: 'Trainer Instructions', method: 'Method', logistics: 'Logistics',
    script: 'Script', activity: 'Activity', objective: 'Objective',
    instructionsParticipant: 'Participant Instructions', instructionsFacilitator: 'Facilitator Instructions',
    debrief: 'Debrief', example: 'Example', videoScript: 'Video Script',
  };
}

async function handleGenerateLocalizedLabels(course: any, language: string = 'en'): Promise<LocalizedLabels> {
  const fallback = getDefaultEnglishLabels();
  const prompt = `
You are a localization editor for training materials.
Translate the 18 UI and heading labels below into ${language}.
Return ONLY one JSON object with exactly these keys and string values. Do not add or remove keys.
Keep the meaning concise and natural for professional training materials.

Keys: ${LOCALIZED_LABEL_KEYS.join(', ')}
Course title: ${course?.title || 'Training course'}
Subject: ${course?.subject || 'General training'}
`;

  try {
    const raw = await callLLM(prompt, language);
    const parsed = repairAndParseJson<Partial<LocalizedLabels>>(raw);
    const valid = LOCALIZED_LABEL_KEYS.every(key => typeof parsed?.[key] === 'string' && parsed[key]!.trim().length > 0);
    if (valid) return parsed as LocalizedLabels;
    Logger.warn('[LocalizedLabels] Invalid label set; using English fallback.');
  } catch (error) {
    Logger.warn('[LocalizedLabels] Generation failed; using English fallback.', error);
  }
  return fallback;
}

async function handleGenerateLearningObjectives(course: any): Promise<string> {
    const title = course.title || "Untitled Course";
    const subject = course.subject || "Not specified";
    const targetAudience = course.target_audience || "General Audience";
    const environment = course.environment || "LIVE";
    const lang = course.language || "ro";

    const prompt = `
    **ROLE**: Expert Instructional Designer specializing in Bloom's Taxonomy.
    **TASK**: Generate a set of 3 to 5 clear, specific, and actionable learning objectives for a training course.
    **CONTEXT**:
    - Course Title: "${title}"
    - Subject/Topic: "${subject}"
    - Target Audience: "${targetAudience}"
    - Format/Environment: "${environment}" (LIVE workshop or ONLINE course)
    
    **BLOOM'S TAXONOMY RULES**:
    - Focus on what the participants will be able to DO after the course, not just what they will read or understand.
    - Use active, measurable action verbs (e.g., Analyze, Design, Implement, Construct, Formulate, Evaluate) representing various cognitive levels of Bloom's Taxonomy.
    
    **OUTPUT FORMAT (JSON ONLY)**:
    You MUST return a valid JSON object with the following key:
    {
      "objectives": [
        "First learning objective...",
        "Second learning objective...",
        "Third learning objective..."
      ]
    }
    
    Do NOT include markdown block wrappers (like \`\`\`json). Return ONLY the raw JSON string.
    Ensure the objectives are written entirely in the target language: **${lang}**.
    `;

    Logger.info(`[Objectives] Generating learning objectives for course: ${title}`);
    const rawResponse = await callLLM(prompt, lang);
    
    // Clean up any possible markdown wrappers
    let cleaned = rawResponse.replace(/```json/gi, '').replace(/```/gi, '').trim();
    
    // Validate if it's parsable
    try {
        const parsed = JSON.parse(cleaned);
        if (parsed && Array.isArray(parsed.objectives)) {
            return JSON.stringify(parsed);
        }
    } catch (e) {
        Logger.warn(`[Objectives] Failed to parse generated objectives as JSON: ${e.message}. Raw response: ${rawResponse}`);
    }
    
    // Fallback: If not valid JSON, split by line and clean
    const lines = cleaned.split('\n')
        .map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*•]\s*/, '').trim())
        .filter(l => l.length > 5 && !l.startsWith('{') && !l.startsWith('}') && !l.startsWith('"') && !l.startsWith('['));
    
    if (lines.length > 0) {
        return JSON.stringify({ objectives: lines });
    }
    
    // Final fallback. Only Romanian gets Romanian objectives; every other language
    // falls back to English rather than silently defaulting to Romanian.
    const isRoObjectives = (lang || '').toLowerCase().startsWith('ro');
    return JSON.stringify({
        objectives: isRoObjectives ? [
            `Definirea conceptelor de bază din ${title}`,
            `Aplicarea tehnicilor practice specifice audienței: ${targetAudience}`,
            `Evaluarea rezultatelor și optimizarea fluxului de lucru`
        ] : [
            `Define the core concepts of ${title}`,
            `Apply practical techniques specific to the audience: ${targetAudience}`,
            `Evaluate results and optimize the workflow`
        ]
    });
}

async function handleChatOnboarding(chat_history: any[], course: any): Promise<string> {
    const conversation = chat_history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const lang = course.language || 'Romanian';
    
    // ----------------------------------------------------------------------------
    // PHASE 1: CONVERSATION ANALYST (Is the user done?)
    // ----------------------------------------------------------------------------
    // Solution to "Prompt Overload" (Problem #2)
    // Split the logic: First determine IF we are ready, THEN generate.
    
    const analystPrompt = `
    **ROLE**: Course Requirements Analyst.
    **TASK**: Analyze the conversation to see if we have enough info to build a course blueprint.
    **CONTEXT**: 
    Course Title: ${course.title}
    Language: ${lang}
    
    **CONVERSATION HISTORY**:
    ${conversation}
    
    **REQUIREMENTS FOR BLUEPRINT**:
    1. Target Audience (Who is this for?)
    2. Learning Objectives (What will they learn?)
    3. Scope/Duration (Rough estimate or depth)

    **DECISION LOGIC**:
    - IF information is missing: Generate a polite, short question in ${lang} to ask for it.
    - IF information is sufficient: Set status to "READY" and summarize the gathered requirements.
    - **CRITICAL**: If the user says "Am toate informațiile necesare" or similar confirmation, set status to "READY" IMMEDIATELY.
    - **CRITICAL**: If the conversation history shows the user has already provided Audience, Objectives, and Duration, DO NOT ASK AGAIN. Set status to "READY".

    **OUTPUT FORMAT (JSON ONLY)**:
    {
      "status": "READY" | "NEEDS_INFO",
      "message": "Your question to the user (if NEEDS_INFO) or a confirmation message (if READY)",
      "gathered_requirements": {
         "audience": "...",
         "objectives": "...",
         "duration": "..."
      }
    }
    
    Return ONLY valid JSON.
    `;

    Logger.info("Step 1: Running Conversation Analyst...");
    const rawAnalyst = await callLLM(analystPrompt, lang);
    Logger.info("Step 1: Raw Analyst Response", rawAnalyst);
    let analystData;
    
    try {
        analystData = repairAndParseJson<{status: string, message: string, gathered_requirements: any}>(rawAnalyst);
        Logger.info("Step 1: Parsed Analyst Data", analystData);
    } catch (e) {
        Logger.error("Failed to parse Analyst response", e);
        // Fallback: Assume we need more info if AI failed to format correctly.
        // Only Romanian gets the Romanian message; every other language falls back to English.
        const isRoChat = (lang || '').toLowerCase().startsWith('ro');
        return JSON.stringify({
            message: isRoChat
                ? "Îmi poți da te rog mai multe detalii despre audiența țintă și obiective?"
                : "Could you give me a bit more detail about the target audience and objectives?",
            blueprint: null
        });
    }

    if (analystData?.status !== 'READY') {
        Logger.info("Analyst Status: NEEDS_INFO");
        return JSON.stringify({
            message: analystData?.message || "Could you provide more details about the target audience?",
            blueprint: null
        });
    }

    // ----------------------------------------------------------------------------
    // PHASE 2: BLUEPRINT ARCHITECT (Generate the structure)
    // ----------------------------------------------------------------------------
    Logger.info("Analyst Status: READY. Running Blueprint Architect...");
    
    const architectPrompt = `
    **ROLE**: Expert Instructional Designer.
    **TASK**: Generate a detailed Course Blueprint JSON based on gathered requirements.
    **LANGUAGE**: ${lang}
    
    **REQUIREMENTS**:
    ${JSON.stringify(analystData.gathered_requirements, null, 2)}
    
    **PEDAGOGICAL STRUCTURE RULES**:
    - Create a logical flow of modules.
    - Each module must have 3-5 sections (Hook, Theory, Practice, Review).
    - Mix content types (slides, video_script, exercise, quiz).
    - **Language**: All titles and content must be in **${lang}**.
    
    **OUTPUT FORMAT (JSON ONLY)**:
    {
      "title": "Refined Title",
      "target_audience": "...",
      "estimated_duration": "...",
      "modules": [
          {
            "title": "Module Title",
            "duration": "...",
            "learning_objective": "...",
            "sections": [
              { "title": "Section Title", "content_type": "slides" }
            ]
          }
      ]
    }
    
    Return ONLY valid JSON.
    `;

    const rawBlueprint = await callLLM(architectPrompt, lang);
    let blueprintData;
    try {
        blueprintData = repairAndParseJson(rawBlueprint);
    } catch (e) {
        Logger.error("Failed to parse Blueprint", e);
        const isRoBlueprint = (lang || '').toLowerCase().startsWith('ro');
        return JSON.stringify({
            message: isRoBlueprint
                ? "Am întâmpinat o eroare tehnică la generarea structurii. Te rog să mai încerci o dată."
                : "I ran into a technical error generating the structure. Please try again.",
            blueprint: null
        });
    }

    // Combine for the final return
    return JSON.stringify({
        message: analystData.message, 
        blueprint: blueprintData
    });
}

async function handleRefineBlueprint(course: any, blueprint: any, language: string): Promise<string> {
    const lang = language || course.language || 'Romanian';
    const prompt = `
    **ROLE**: Expert Instructional Designer.
    **TASK**: Analyze the current Course Blueprint and refine it to make it more pedagogical, structured, and engaging.
    **LANGUAGE**: ${lang}
    
    **COURSE INFO**:
    Title: ${course.title}
    Audience: ${course.target_audience}
    Duration: ${course.estimated_duration}
    
    **CURRENT BLUEPRINT**:
    ${JSON.stringify(blueprint, null, 2)}
    
    **REFINEMENT RULES**:
    1. **Pedagogical improvements**: Enhance module titles, section titles, and learning objectives to make them clearer, more professional, and directly actionable.
    2. **Engagement**: Ensure sections within each module have a logical flow (e.g. starting with Hook/Warmup, then Theory/Explainer, then Practice/Exercise, and finishing with Review/Quiz/Decisions).
    3. **Consistency**: Ensure all modules and sections conform to the target audience level and style.
    4. **Maintain structure**: Keep the same number of modules or a very similar logical structure. Make sure every module has sections with titles and correct \`content_type\` fields (\`slides\`, \`video_script\`, \`exercise\`, \`quiz\` etc.).
    5. **Language**: All output must be strictly in **${lang}**.
    
    **OUTPUT FORMAT (JSON ONLY - matching this schema)**:
    {
      "title": "[Refined Course Title]",
      "target_audience": "[Refined Target Audience description]",
      "estimated_duration": "[Refined Estimated Duration]",
      "modules": [
        {
          "id": "Module ID (keep original or generate standard)",
          "title": "[Refined Module Title]",
          "duration": "[Module Duration in minutes]",
          "learning_objective": "[Refined learning objective]",
          "sections": [
            {
              "id": "Section ID",
              "title": "[Refined Section Title]",
              "content_type": "[slides | video_script | exercise | quiz]"
            }
          ]
        }
      ]
    }
    
    Return ONLY valid JSON. No explanations, no markdown fences.
    `;

    Logger.info("[RefineBlueprint] Calling LLM...");
    const raw = await callLLM(prompt, lang);
    Logger.info("[RefineBlueprint] Raw response received");
    
    try {
        const parsed = repairAndParseJson(raw);
        return JSON.stringify(parsed);
    } catch (e) {
        Logger.error("[RefineBlueprint] Failed to parse refined blueprint", e);
        return JSON.stringify(blueprint);
    }
}

function fillPromptTemplate(template: string, variables: Record<string, any>): string {
  let output = template;
  for (const [key, value] of Object.entries(variables)) {
    output = output.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return output;
}

// ==========================================
// 9. MISSING HELPERS (HOTFIX)
// ==========================================

async function resolveModuleId(supabase: any, courseId: string, moduleData: any, moduleIndex: number): Promise<string> {
  // Only trust the ID if it looks like a real UUID (not a synthetic frontend ID like 'generated-mod-0')
  const isRealUuid = moduleData?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(moduleData.id);
  if (isRealUuid) {
    return moduleData.id;
  }
  
  // Fallback: fetch from DB by index
  const { data, error } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('module_index', moduleIndex)
    .limit(1);
    
  if (data && data.length > 0) {
    return data[0].id;
  }
  
  // If not found, CREATE IT based on moduleData
  // This ensures the DB is in sync with the Blueprint
  Logger.info(`[resolveModuleId] Module not found for index ${moduleIndex}. Creating it...`);
  
  const { data: newModule, error: createError } = await supabase
    .from('course_modules')
    .insert({
        course_id: courseId,
        module_index: moduleIndex,
        title: moduleData.title || `Module ${moduleIndex + 1}`,
        duration_minutes: parseInt(String(moduleData.duration || '60').replace(/\D/g, '') || '60'),
        content_data: null, // Start empty
        is_dirty: true
    })
    .select('id')
    .single();

  if (createError || !newModule) {
      Logger.error(`Failed to auto-create module ${moduleIndex}`, createError);
      throw new Error(`Could not resolve or create module ID for index ${moduleIndex} | DB Error: ${JSON.stringify(createError)}`);
  }
  
  return newModule.id;
}

// --- Interfaces for structured workbook intro/outro data ---
interface WorkbookIntroData {
  localizedLabels: {
    activityLabel: string;
    whyWeDoThis: string;
    contextTitle: string;
    realityCol: string;
    opportunityCol: string;
    companyInfoTitle: string;
    roadmapTitle: string;
    durationLabel: string;
    practicalLabel: string;
    theoryLabel: string;
  };
  warmupActivity: {
    title: string;
    durationMinutes: number;
    instructions: string[];
    rationale: string[];
  };
  contextTable: {
    rows: Array<{ reality: string; opportunity: string }>;
  };
  companyInfo?: {
    rows: Array<{ label: string; value: string }>;
  };
  roadmap: {
    modules: Array<{ title: string; durationMinutes: number; practicalPercent: number }>;
  };
}

interface WorkbookOutroData {
  localizedLabels: {
    actionPlanTitle: string;
    days30: string;
    days60: string;
    days90: string;
    commitmentTitle: string;
    nextStepsTitle: string;
    nameLabel: string;
    dateLabel: string;
    signatureLabel: string;
  };
  actionPlan: {
    rows: Array<{ days30: string; days60: string; days90: string }>;
  };
  nextSteps: string[];
}

function renderWorkbookIntroHtml(data: WorkbookIntroData): string {
  const font = 'font-family:Arial,sans-serif;';
  const L = data.localizedLabels;
  let html = '';

  // 1. Warm-up activity box
  html += `<div style="border:1px solid #28a745;border-radius:4px;margin:0 0 20px 0;${font}">`;
  html += `<div style="background:#28a745;color:white;padding:8px 14px;font-weight:bold;font-size:14px;">${escHtml(L.activityLabel)}: ${escHtml(data.warmupActivity.title)} (${data.warmupActivity.durationMinutes} min)</div>`;
  html += `<div style="padding:12px 14px;">`;
  if (data.warmupActivity.instructions.length) {
    html += `<table style="width:100%;border-collapse:collapse;">`;
    data.warmupActivity.instructions.forEach(instr => {
      html += `<tr><td style="padding:5px 8px;border-bottom:1px solid #e8f5e9;">${escHtml(instr)}</td></tr>`;
    });
    html += `</table>`;
  }
  if (data.warmupActivity.rationale.length) {
    html += `<div style="padding:8px 0 4px;font-style:italic;color:#2e7d32;font-weight:600;">${escHtml(L.whyWeDoThis)}</div>`;
    html += `<table style="width:100%;border-collapse:collapse;">`;
    data.warmupActivity.rationale.forEach(r => {
      html += `<tr><td style="padding:4px 8px;color:#555;">• ${escHtml(r)}</td></tr>`;
    });
    html += `</table>`;
  }
  html += `</div></div>`;

  // 2. Context table (reality vs opportunity)
  if (data.contextTable.rows.length) {
    html += `<h3 style="color:#1a1a2e;border-bottom:2px solid #4a90d9;padding-bottom:4px;margin:16px 0 8px 0;${font}">${escHtml(L.contextTitle)}</h3>`;
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`;
    html += `<tr>`;
    html += `<th style="background:#b71c1c;color:white;padding:10px;text-align:left;${font}width:50%;">${escHtml(L.realityCol)}</th>`;
    html += `<th style="background:#2e7d32;color:white;padding:10px;text-align:left;${font}width:50%;">${escHtml(L.opportunityCol)}</th>`;
    html += `</tr>`;
    data.contextTable.rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f9f9f9';
      html += `<tr style="background:${bg};">`;
      html += `<td style="padding:8px 10px;border:1px solid #ddd;vertical-align:top;${font}">${escHtml(row.reality)}</td>`;
      html += `<td style="padding:8px 10px;border:1px solid #ddd;vertical-align:top;${font}">${escHtml(row.opportunity)}</td>`;
      html += `</tr>`;
    });
    html += `</table>`;
  }

  // 3. Company info (optional)
  if (data.companyInfo?.rows?.length) {
    html += `<h3 style="color:#1a1a2e;border-bottom:2px solid #4a90d9;padding-bottom:4px;margin:16px 0 8px 0;${font}">${escHtml(L.companyInfoTitle)}</h3>`;
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`;
    data.companyInfo.rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f9f9f9';
      html += `<tr style="background:${bg};">`;
      html += `<td style="padding:6px 10px;border:1px solid #ddd;font-weight:bold;width:35%;${font}">${escHtml(row.label)}</td>`;
      html += `<td style="padding:6px 10px;border:1px solid #ddd;${font}">${escHtml(row.value)}</td>`;
      html += `</tr>`;
    });
    html += `</table>`;
  }

  // 4. Course roadmap
  if (data.roadmap.modules.length) {
    html += `<h3 style="color:#1a1a2e;border-bottom:2px solid #4a90d9;padding-bottom:4px;margin:16px 0 8px 0;${font}">${escHtml(L.roadmapTitle)}</h3>`;
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">`;
    html += `<tr>`;
    html += `<th style="background:#1a3c6e;color:white;padding:8px 10px;text-align:left;${font}">#</th>`;
    html += `<th style="background:#1a3c6e;color:white;padding:8px 10px;text-align:left;${font}">Modul</th>`;
    html += `<th style="background:#1a3c6e;color:white;padding:8px 10px;text-align:center;${font}">${escHtml(L.durationLabel)}</th>`;
    html += `<th style="background:#1a3c6e;color:white;padding:8px 10px;text-align:center;${font}">${escHtml(L.practicalLabel)}/${escHtml(L.theoryLabel)}</th>`;
    html += `</tr>`;
    data.roadmap.modules.forEach((m, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f0f4ff';
      html += `<tr style="background:${bg};">`;
      html += `<td style="padding:6px 10px;border:1px solid #ddd;text-align:center;${font}">${i + 1}</td>`;
      html += `<td style="padding:6px 10px;border:1px solid #ddd;${font}">${escHtml(m.title)}</td>`;
      html += `<td style="padding:6px 10px;border:1px solid #ddd;text-align:center;${font}">${m.durationMinutes} min</td>`;
      html += `<td style="padding:6px 10px;border:1px solid #ddd;text-align:center;${font}">${m.practicalPercent}% / ${100 - m.practicalPercent}%</td>`;
      html += `</tr>`;
    });
    html += `</table>`;
  }

  return html;
}

function renderWorkbookOutroHtml(data: WorkbookOutroData): string {
  const font = 'font-family:Arial,sans-serif;';
  const L = data.localizedLabels;
  let html = '';

  // 1. Action plan table
  if (data.actionPlan.rows.length) {
    html += `<h3 style="color:#1a1a2e;border-bottom:2px solid #4a90d9;padding-bottom:4px;margin:0 0 12px 0;${font}">${escHtml(L.actionPlanTitle)}</h3>`;
    html += `<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">`;
    html += `<tr>`;
    html += `<th style="background:#1565c0;color:white;padding:10px;text-align:center;${font}width:33%;">${escHtml(L.days30)}</th>`;
    html += `<th style="background:#2e7d32;color:white;padding:10px;text-align:center;${font}width:33%;">${escHtml(L.days60)}</th>`;
    html += `<th style="background:#6a1b9a;color:white;padding:10px;text-align:center;${font}width:34%;">${escHtml(L.days90)}</th>`;
    html += `</tr>`;
    data.actionPlan.rows.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#fff' : '#f9f9f9';
      html += `<tr style="background:${bg};">`;
      html += `<td style="padding:8px 10px;border:1px solid #ddd;vertical-align:top;${font}">${escHtml(row.days30)}</td>`;
      html += `<td style="padding:8px 10px;border:1px solid #ddd;vertical-align:top;${font}">${escHtml(row.days60)}</td>`;
      html += `<td style="padding:8px 10px;border:1px solid #ddd;vertical-align:top;${font}">${escHtml(row.days90)}</td>`;
      html += `</tr>`;
    });
    html += `</table>`;
  }

  // 2. Next steps checklist
  if (data.nextSteps.length) {
    html += `<h3 style="color:#1a1a2e;border-bottom:2px solid #4a90d9;padding-bottom:4px;margin:0 0 12px 0;${font}">${escHtml(L.nextStepsTitle)}</h3>`;
    html += `<div style="margin-bottom:20px;">`;
    data.nextSteps.forEach(step => {
      html += `<div style="margin:6px 0;${font}">☐ ${escHtml(step)}</div>`;
    });
    html += `</div>`;
  }

  // 3. Commitment card
  html += `<div style="border:2px solid #1a3c6e;border-radius:6px;padding:20px;margin-top:16px;${font}">`;
  html += `<h3 style="color:#1a3c6e;margin:0 0 16px 0;text-align:center;">${escHtml(L.commitmentTitle)}</h3>`;
  html += `<div style="margin:12px 0;">${escHtml(L.nameLabel)}<div style="border-bottom:1px solid #333;min-height:28px;margin-top:4px;"></div></div>`;
  html += `<div style="margin:12px 0;">${escHtml(L.dateLabel)}<div style="border-bottom:1px solid #333;min-height:28px;margin-top:4px;"></div></div>`;
  html += `<div style="margin:12px 0;">${escHtml(L.signatureLabel)}<div style="border-bottom:1px solid #333;min-height:50px;margin-top:4px;"></div></div>`;
  html += `</div>`;

  return html;
}

async function generateWorkbookIntro(course: Course): Promise<string> {
  const lang = course.language || 'Romanian';
  const dnaContext = {
    domainContext: (course.dna as any)?.domainContext,
    challenges: (course.dna as any)?.challenges?.slice?.(0, 5),
    opportunities: (course.dna as any)?.opportunities?.slice?.(0, 5),
    companyFacts: (course.dna as any)?.companyFacts,
    modules: course.blueprint?.modules?.slice?.(0, 15)?.map((m: any) => ({ title: m.title, duration: m.duration_minutes || m.duration })),
  };
  const interfaceText = `{
  localizedLabels: { activityLabel, whyWeDoThis, contextTitle, realityCol, opportunityCol, companyInfoTitle, roadmapTitle, durationLabel, practicalLabel, theoryLabel },
  warmupActivity: { title: string, durationMinutes: number, instructions: string[], rationale: string[] },
  contextTable: { rows: Array<{ reality: string, opportunity: string }> },
  companyInfo?: { rows: Array<{ label: string, value: string }> },
  roadmap: { modules: Array<{ title: string, durationMinutes: number, practicalPercent: number }> }
}`;

  const prompt = `Generate a JSON object for the Workbook Introduction section.
COURSE: "${course.title}"
AUDIENCE: "${course.target_audience || 'Professionals'}"
LANGUAGE: ${lang}
DNA CONTEXT (extract REAL data for contextTable and companyInfo from this):
${JSON.stringify(dnaContext, null, 2).substring(0, 2500)}

Return ONLY valid JSON matching this interface:
${interfaceText}

RULES:
1. ALL string values MUST be in ${lang}
2. warmupActivity: design a specific, relevant warm-up for THIS course topic (not generic)
3. contextTable: 4-6 rows using REAL data from DNA — challenges participants face (reality) vs what course solves (opportunity)
4. companyInfo: include ONLY if DNA has company/product/industry data; omit field if no data available
5. roadmap: use actual module titles from DNA context; estimate practicalPercent 60-80 for most modules
6. Return ONLY JSON, no markdown fences, no explanation`;

  try {
    const raw = await callLLM(prompt, course.language || 'ro');
    const introData = repairAndParseJson<WorkbookIntroData>(raw);
    return renderWorkbookIntroHtml(introData);
  } catch (e) {
    Logger.error('[generateWorkbookIntro] Failed to parse JSON or render HTML', e);
    // Fallback: minimal HTML intro. Only Romanian gets the Romanian text; every other
    // language falls back to English rather than silently defaulting to Romanian.
    const isRoIntro = (course.language || '').toLowerCase().startsWith('ro');
    return isRoIntro
      ? `<h2 style="font-family:Arial,sans-serif;color:#1a1a2e;">Bun venit la ${course.title || 'Curs'}</h2><p style="font-family:Arial,sans-serif;">Acest caiet este instrumentul tău de lucru pe parcursul cursului. Notează, reflectează și completează exercițiile.</p>`
      : `<h2 style="font-family:Arial,sans-serif;color:#1a1a2e;">Welcome to ${course.title || 'the Course'}</h2><p style="font-family:Arial,sans-serif;">This workbook is your working tool throughout the course. Take notes, reflect, and complete the exercises.</p>`;
  }
}

async function generateWorkbookOutro(course: Course): Promise<string> {
  const lang = course.language || 'Romanian';
  const interfaceText = `{
  localizedLabels: { actionPlanTitle, days30, days60, days90, commitmentTitle, nextStepsTitle, nameLabel, dateLabel, signatureLabel },
  actionPlan: { rows: Array<{ days30: string, days60: string, days90: string }> },
  nextSteps: string[]
}`;

  const prompt = `Generate a JSON object for the Workbook Conclusion section.
COURSE: "${course.title}"
LANGUAGE: ${lang}

Return ONLY valid JSON matching this interface:
${interfaceText}

RULES:
1. ALL string values MUST be in ${lang}
2. actionPlan: 3-4 rows of concrete actions participants should take in first 30/60/90 days after the course
3. nextSteps: 5-7 specific, actionable steps directly related to the course content
4. Labels should be natural in ${lang} (e.g. Romanian: "Plan de Acțiune 30-60-90", "Angajamentul meu")
5. Return ONLY JSON, no markdown fences, no explanation`;

  try {
    const raw = await callLLM(prompt, course.language || 'ro');
    const outroData = repairAndParseJson<WorkbookOutroData>(raw);
    return renderWorkbookOutroHtml(outroData);
  } catch (e) {
    Logger.error('[generateWorkbookOutro] Failed to parse JSON or render HTML', e);
    // Only Romanian gets the Romanian text; every other language falls back to English.
    const isRoOutro = (course.language || '').toLowerCase().startsWith('ro');
    return isRoOutro
      ? `<h2 style="font-family:Arial,sans-serif;color:#1a1a2e;">Pași următori</h2><p style="font-family:Arial,sans-serif;">Aplică ce ai învățat! Identifică 3 acțiuni concrete pe care le vei lua în următoarele 30 de zile.</p>`
      : `<h2 style="font-family:Arial,sans-serif;color:#1a1a2e;">Next Steps</h2><p style="font-family:Arial,sans-serif;">Apply what you've learned! Identify 3 concrete actions you'll take in the next 30 days.</p>`;
  }
}
