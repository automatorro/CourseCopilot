import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ModuleContractSchema } from '../src/schemas/moduleContractSchema.ts';
import { CONTRACT_PROMPT_V1 } from '../supabase/functions/generate-course-content/prompts/module-contract.ts';
import { repairAndParseJson } from '../supabase/functions/generate-course-content/utils/json-repair.ts';
import { validateModuleContract } from '../supabase/functions/generate-course-content/prompts/validate-module-contract.ts';

const MODEL = 'claude-sonnet-5';
const DEFAULT_WORKSPACE_ID = 'wrkspc_01CfRoZ5D1KYnNSLd7i8C1Yz';
const CONTRACT_VERSION = 1;
const LANGUAGES = ['ro', 'en'];

const COURSE = {
  ro: {
    title: 'Managementul Stakeholderilor pentru Manageri de Proiect Juniori',
    description:
      'Un curs online de 4 ore pentru manageri de proiect aflați la început de drum, din companii de servicii IT.',
    subject: 'Managementul stakeholderilor în proiecte IT',
    audience:
      'Manageri de proiect cu 0–2 ani experiență în companii IT de outsourcing, consultanță sau produs custom.',
    objectives:
      'Maparea stakeholderilor pe axa influență/interes; alegerea canalelor și frecvenței de comunicare; recunoașterea și dezamorsarea conflictelor dintre stakeholderi tehnici și de business.',
    tone: 'direct, cald, fără corporatisme; folosim «tu»; umor discret; interzis: «sinergie», «paradigmă»',
    terminology: {
      participant: 'participant',
      trainer: 'trainer',
      exercise: 'exercițiu',
      required: ['stakeholder', 'sponsor de proiect', 'matrice influență/interes'],
      forbidden: ['sinergie', 'paradigmă'],
    },
  },
  en: {
    title: 'Stakeholder Management for Junior Project Managers',
    description:
      'A 4-hour online course for early-career project managers working in IT services companies.',
    subject: 'Stakeholder management in IT projects',
    audience:
      'Early-career project managers with 0–2 years of experience in IT outsourcing, consulting, or custom product companies.',
    objectives:
      'Map stakeholders on the influence/interest axis; choose suitable communication channels and cadence; recognize and defuse conflicts between technical and business stakeholders.',
    tone: 'direct, warm, no corporate-speak; use "you"; light humor; forbidden: "synergy", "paradigm"',
    terminology: {
      participant: 'participant',
      trainer: 'trainer',
      exercise: 'exercise',
      required: ['stakeholder', 'project sponsor', 'influence/interest matrix'],
      forbidden: ['synergy', 'paradigm'],
    },
  },
};

const MODULES = [
  {
    title: {
      ro: 'Identificarea și cartografierea stakeholderilor',
      en: 'Identifying and mapping stakeholders',
    },
    objective: {
      ro: 'Mapează stakeholderii unui proiect IT pe axa influență/interes și justifică fiecare poziționare.',
      en: 'Map an IT project’s stakeholders on the influence/interest axis and justify each placement.',
    },
    bloomLevel: 'APPLY',
    bloomVerb: { ro: 'mapează', en: 'map' },
  },
  {
    title: {
      ro: 'Prioritizarea stakeholderilor',
      en: 'Prioritizing stakeholders',
    },
    objective: {
      ro: 'Prioritizează stakeholderii unui proiect IT în funcție de influență, interes și riscul pentru livrare.',
      en: 'Prioritize an IT project’s stakeholders by influence, interest, and delivery risk.',
    },
    bloomLevel: 'EVALUATE',
    bloomVerb: { ro: 'prioritizează', en: 'prioritize' },
  },
  {
    title: {
      ro: 'Planificarea comunicării',
      en: 'Planning stakeholder communication',
    },
    objective: {
      ro: 'Alege canalul și frecvența de comunicare potrivite pentru fiecare cadran al matricei influență/interes.',
      en: 'Choose a suitable communication channel and cadence for each influence/interest quadrant.',
    },
    bloomLevel: 'APPLY',
    bloomVerb: { ro: 'alege', en: 'choose' },
  },
  {
    title: {
      ro: 'Gestionarea conflictelor tehnic–business',
      en: 'Managing technical–business conflicts',
    },
    objective: {
      ro: 'Evaluează un conflict dintre stakeholderi tehnici și de business și justifică o abordare de dezamorsare.',
      en: 'Evaluate a conflict between technical and business stakeholders and justify a de-escalation approach.',
    },
    bloomLevel: 'EVALUATE',
    bloomVerb: { ro: 'evaluează', en: 'evaluate' },
  },
];

const BLOOM_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
const PHASES = ['ACTIVATION', 'DEMONSTRATION', 'APPLICATION', 'BREAK'];

function exerciseSpecSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['format', 'scenarioSeed', 'characters', 'evidenceOfLearning', 'debriefBloomVerb'],
    properties: {
      format: { type: 'string', minLength: 1 },
      scenarioSeed: { type: 'string', minLength: 1 },
      characters: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
      evidenceOfLearning: { type: 'string', minLength: 1 },
      debriefBloomVerb: { type: 'string', minLength: 1 },
    },
  };
}

function blockSchema(phase) {
  const required = ['id', 'phase', 'title', 'durationMinutes', 'keyPoints'];
  const properties = {
    id: { type: 'string', minLength: 1 },
    phase: { const: phase },
    title: { type: 'string', minLength: 1 },
    durationMinutes: {
      type: 'integer',
      minimum: phase === 'BREAK' ? 1 : 15,
      maximum: 25,
    },
    keyPoints: {
      type: 'array',
      minItems: 2,
      maxItems: 5,
      items: { type: 'string', minLength: 1 },
    },
  };

  if (phase === 'APPLICATION') {
    required.push('exerciseSpec');
    properties.exerciseSpec = exerciseSpecSchema();
  }

  return {
    type: 'object',
    additionalProperties: false,
    required,
    properties,
  };
}

const CONTRACT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['objective', 'blocks', 'transitions'],
  properties: {
    objective: {
      type: 'object',
      additionalProperties: false,
      required: ['statement', 'bloomLevel', 'bloomVerb'],
      properties: {
        statement: { type: 'string', minLength: 1 },
        bloomLevel: { type: 'string', enum: BLOOM_LEVELS },
        bloomVerb: { type: 'string', minLength: 1 },
      },
    },
    blocks: {
      type: 'array',
      minItems: 3,
      items: { oneOf: PHASES.map(blockSchema) },
    },
    transitions: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', minLength: 1 },
    },
  },
};

export function canonicalContractJson(value) {
  if (Array.isArray(value)) return value.map(canonicalContractJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, canonicalContractJson(value[key])]),
    );
  }
  return value;
}

export function hashContract(contract) {
  const canonical = JSON.stringify(canonicalContractJson(contract));
  return createHash('sha256').update(canonical).digest('hex');
}

function tonePreamble(language) {
  const course = COURSE[language];
  const terms = course.terminology;
  const languageName = language === 'ro' ? 'Romanian' : 'English';
  return [
    '## VOICE (verbatim from the course author — emulate faithfully)',
    `"${course.tone}"`,
    'Write every sentence as if this author wrote it. Apply this voice to all prose.',
    '',
    '## TERMINOLOGY (mandatory)',
    `Use exactly: participant="${terms.participant}", trainer="${terms.trainer}", exercise="${terms.exercise}".`,
    `Required terms: ${terms.required.join(', ')}.`,
    `NEVER use: ${terms.forbidden.join(', ')}.`,
    '',
    '## DELIVERY ENVIRONMENT',
    'Online course. Use realistic online activities such as shared documents, chat, and breakout rooms.',
    `All natural-language output must be in ${languageName}. Keep JSON field names in English.`,
  ].join('\n');
}

export function buildContractPrompt({ language, module, retryIssues = [] }) {
  if (!LANGUAGES.includes(language)) throw new Error(`Unsupported contract language: ${language}`);
  const course = COURSE[language];
  const languageName = language === 'ro' ? 'Romanian' : 'English';
  const retryFeedback = retryIssues.length
    ? `\n\nFix every issue from the previous attempt:\n${retryIssues.map(issue => `- ${issue}`).join('\n')}`
    : '';
  const task = [
    CONTRACT_PROMPT_V1.task,
    'Duration limits: every non-BREAK block must be 15-25 minutes; BREAK blocks may be 1-25 minutes.',
    retryFeedback,
  ].filter(Boolean).join('\n\n');
  const format = CONTRACT_PROMPT_V1.format.replace(
    '{{schemaJson}}',
    JSON.stringify(CONTRACT_JSON_SCHEMA, null, 2),
  );
  const quality = CONTRACT_PROMPT_V1.quality.split('{{language}}').join(languageName);

  return [
    CONTRACT_PROMPT_V1.role,
    tonePreamble(language),
    [
      '## COURSE CONTEXT',
      `Title: ${course.title}`,
      `Description: ${course.description}`,
      `Subject: ${course.subject}`,
      `Target audience: ${course.audience}`,
      `Course outcomes: ${course.objectives}`,
      'Environment: online course.',
    ].join('\n'),
    [
      '## UNIT CONTEXT',
      `Module title: ${module.title[language]}`,
      'Duration: 60 minutes.',
      `Required objective statement: ${module.objective[language]}`,
      `Required Bloom level: ${module.bloomLevel}.`,
      `Required Bloom verb: ${module.bloomVerb[language]}.`,
    ].join('\n'),
    task,
    format,
    quality,
  ].filter(layer => layer.trim()).join('\n\n');
}

function schemaIssues(error) {
  if (Array.isArray(error?.issues)) {
    return error.issues.map(issue => {
      const path = issue.path.length ? issue.path.join('.') : '<root>';
      return `${path}: ${issue.message}`;
    });
  }
  return [error instanceof Error ? error.message : String(error)];
}

export async function generateValidatedContract({ language, module, generate }) {
  let issues = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    const generated = await generate(buildContractPrompt({ language, module, retryIssues: issues }));
    let raw = generated;
    if (typeof generated === 'string') {
      try {
        raw = repairAndParseJson(generated);
      } catch (error) {
        issues = schemaIssues(error);
        continue;
      }
    }

    let contract;

    try {
      contract = ModuleContractSchema.parse(raw);
    } catch (error) {
      issues = schemaIssues(error);
      continue;
    }

    const result = validateModuleContract(contract, {
      durationMinutes: 60,
      language,
    });
    if (result.issues.length === 0) {
      return {
        contract: result.contract,
        durationAdjustment: result.durationAdjustment,
      };
    }

    issues = result.issues.map(issue => `${issue.path}: ${issue.message}`);
  }

  throw new Error(
    `Contract "${module.title[language]}" remained invalid after one retry:\n${issues.join('\n')}`,
  );
}

export async function requestClaude(prompt, {
  apiKey,
  workspaceId,
  fetchImpl = fetch,
}) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required.');

  const headers = {
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01',
    'x-api-key': apiKey,
  };
  if (workspaceId) headers['anthropic-workspace-id'] = workspaceId;

  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`Anthropic API request failed (${response.status}): ${body?.error?.message || 'Unknown API error'}`);
  }

  const text = Array.isArray(body?.content)
    ? body.content.filter(block => block.type === 'text').map(block => block.text).join('')
    : '';
  if (!text) throw new Error('Anthropic API returned no text content.');
  return text;
}

function outputPathFromArgs(args) {
  const outIndex = args.indexOf('--out');
  if (outIndex < 0) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return join(tmpdir(), `coursecopilot-m4-contracts-${stamp}.json`);
  }
  if (!args[outIndex + 1] || args[outIndex + 1].startsWith('--')) {
    throw new Error('Provide a file path after --out.');
  }
  return resolve(args[outIndex + 1]);
}

export async function runHarness({
  apiKey,
  workspaceId,
  outputPath,
  fetchImpl = fetch,
  onProgress = () => {},
}) {
  const results = [];
  const total = MODULES.length * LANGUAGES.length;
  let completed = 0;

  for (const language of LANGUAGES) {
    for (let moduleIndex = 0; moduleIndex < MODULES.length; moduleIndex++) {
      const module = MODULES[moduleIndex];
      const generated = await generateValidatedContract({
        language,
        module,
        generate: prompt => requestClaude(prompt, { apiKey, workspaceId, fetchImpl }),
      });

      results.push({
        language,
        moduleIndex,
        moduleTitle: module.title[language],
        durationMinutes: 60,
        durationAdjustment: generated.durationAdjustment ?? null,
        contractVersion: CONTRACT_VERSION,
        contractHash: hashContract(generated.contract),
        contract: generated.contract,
      });
      completed++;
      onProgress({ completed, total, language, moduleTitle: module.title[language] });
    }
  }

  const destination = resolve(outputPath);
  await writeFile(destination, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    model: MODEL,
    contractVersion: CONTRACT_VERSION,
    count: results.length,
    contracts: results,
  }, null, 2)}\n`, { flag: 'wx' });
  return destination;
}

function printUsage() {
  process.stdout.write(
    'Generate and validate the 4 etalon module contracts in Romanian and English (8 total).\n' +
    'Usage: npm run m4:contracts -- [--out <path>]\n' +
    'Requires ANTHROPIC_API_KEY in the local environment; optionally accepts ANTHROPIC_WORKSPACE_ID.\n' +
    'Writes JSON locally only; does not write to Supabase.\n',
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const outputPath = outputPathFromArgs(args);
  const destination = await runHarness({
    apiKey: process.env.ANTHROPIC_API_KEY,
    workspaceId: process.env.ANTHROPIC_WORKSPACE_ID || DEFAULT_WORKSPACE_ID,
    outputPath,
    onProgress: ({ completed, total, language, moduleTitle }) => {
      process.stderr.write(`[${completed}/${total}] Validated ${language.toUpperCase()}: ${moduleTitle}\n`);
    },
  });
  process.stdout.write(`All 8 contracts passed schema and deterministic validation.\nOutput: ${destination}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
