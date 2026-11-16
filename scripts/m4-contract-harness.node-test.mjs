import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  buildContractPrompt,
  generateValidatedContract,
  hashContract,
  requestClaude,
  runHarness,
} from './m4-contract-harness.mjs';

const module = {
  title: { ro: 'Identificarea stakeholderilor', en: 'Identifying stakeholders' },
  objective: {
    ro: 'Mapează stakeholderii unui proiect IT pe axa influență/interes.',
    en: 'Map an IT project’s stakeholders on the influence/interest axis.',
  },
  bloomLevel: 'APPLY',
  bloomVerb: { ro: 'mapează', en: 'map' },
};

function validContract(language = 'en') {
  return {
    objective: {
      statement: module.objective[language],
      bloomLevel: 'APPLY',
      bloomVerb: module.bloomVerb[language],
    },
    blocks: [
      {
        id: 'activation',
        phase: 'ACTIVATION',
        title: 'Recall a recent stakeholder challenge',
        durationMinutes: 15,
        keyPoints: ['A concrete claim about prior experience.', 'A second concrete claim.'],
      },
      {
        id: 'demonstration',
        phase: 'DEMONSTRATION',
        title: 'Map a worked project example',
        durationMinutes: 20,
        keyPoints: ['Influence and interest are assessed separately.', 'Placement needs evidence.'],
      },
      {
        id: 'application',
        phase: 'APPLICATION',
        title: 'Map a live project case',
        durationMinutes: 25,
        keyPoints: ['Participants classify stakeholders.', 'Participants justify each placement.'],
        exerciseSpec: {
          format: 'Paired case analysis',
          scenarioSeed: 'A delivery deadline changes while a sponsor requests a new priority.',
          characters: ['A project sponsor', 'A technical lead'],
          evidenceOfLearning: 'A completed influence/interest map with evidence for each placement.',
          debriefBloomVerb: language === 'en' ? 'map' : 'mapează',
        },
      },
    ],
    transitions: ['Move from prior experience to the worked example.', 'Move from the example to participant practice.'],
  };
}

test('builds the selected language and module context into the prompt', () => {
  const prompt = buildContractPrompt({ language: 'ro', module });
  assert.match(prompt, /Required Bloom verb: mapează/);
  assert.match(prompt, /All natural-language strings in Romanian/);
  assert.match(prompt, /"bloomLevel"/);
  assert.doesNotMatch(prompt, /\{\{language\}\}|\{\{schemaJson\}\}/);
});

test('generateValidatedContract retries once with deterministic validation errors', async () => {
  const prompts = [];
  const outputs = [
    {
      ...validContract(),
      blocks: validContract().blocks.filter(block => block.phase !== 'APPLICATION'),
    },
    validContract(),
  ];

  const result = await generateValidatedContract({
    language: 'en',
    module,
    generate: async prompt => {
      prompts.push(prompt);
      return outputs.shift();
    },
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /At least one APPLICATION block is required/);
  assert.equal(result.contract.blocks.length, 3);
});

test('generateValidatedContract parses JSON text and retries schema errors once', async () => {
  const prompts = [];
  const outputs = ['[]', validContract()];
  const result = await generateValidatedContract({
    language: 'en',
    module,
    generate: async prompt => {
      prompts.push(prompt);
      return outputs.shift();
    },
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /Fix every issue from the previous attempt/);
  assert.equal(result.contract.objective.bloomVerb, 'map');
});

test('generateValidatedContract surfaces persistent validation errors after one retry', async () => {
  let calls = 0;
  await assert.rejects(
    generateValidatedContract({
      language: 'en',
      module,
      generate: async () => {
        calls++;
        return {
          ...validContract(),
          blocks: validContract().blocks.filter(block => block.phase !== 'APPLICATION'),
        };
      },
    }),
    /remained invalid after one retry/,
  );
  assert.equal(calls, 2);
});

test('contract hashes do not depend on object key order', () => {
  assert.equal(
    hashContract({ objective: { statement: 'x', bloomVerb: 'map' } }),
    hashContract({ objective: { bloomVerb: 'map', statement: 'x' } }),
  );
});

test('requestClaude sends the model request and extracts text', async () => {
  let request;
  const text = await requestClaude('test prompt', {
    apiKey: 'local-test-key',
    workspaceId: 'local-test-workspace',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({
        content: [{ type: 'text', text: '{"ok":true}' }],
      }), { status: 200 });
    },
  });

  assert.equal(text, '{"ok":true}');
  assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(request.options.headers['x-api-key'], 'local-test-key');
  assert.equal(request.options.headers['anthropic-workspace-id'], 'local-test-workspace');
  assert.equal(JSON.parse(request.options.body).model, 'claude-sonnet-5');
});

test('runHarness generates eight validated contracts and writes a local JSON review file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'coursecopilot-m4-test-'));
  const outputPath = join(directory, 'contracts.json');
  let apiCalls = 0;
  const progress = [];

  try {
    const writtenPath = await runHarness({
      apiKey: 'local-test-key',
      outputPath,
      fetchImpl: async (_url, options) => {
        apiCalls++;
        const prompt = JSON.parse(options.body).messages[0].content;
        const statement = prompt.match(/^Required objective statement: (.+)$/m)[1];
        const bloomLevel = prompt.match(/^Required Bloom level: (.+)\.$/m)[1];
        const bloomVerb = prompt.match(/^Required Bloom verb: (.+)\.$/m)[1];
        const contract = {
          objective: { statement, bloomLevel, bloomVerb },
          blocks: [
            {
              id: 'activation',
              phase: 'ACTIVATION',
              title: 'Recall a relevant case',
              durationMinutes: 15,
              keyPoints: ['A concrete claim about participant experience.', 'A second concrete claim.'],
            },
            {
              id: 'demonstration',
              phase: 'DEMONSTRATION',
              title: 'Analyze a worked example',
              durationMinutes: 20,
              keyPoints: ['The example shows the decision process.', 'The decision uses observable evidence.'],
            },
            {
              id: 'application',
              phase: 'APPLICATION',
              title: 'Apply the decision process',
              durationMinutes: 25,
              keyPoints: ['Participants complete a relevant task.', 'Participants justify their decisions.'],
              exerciseSpec: {
                format: 'Paired case analysis',
                scenarioSeed: 'A project sponsor and a technical lead disagree about a delivery priority.',
                characters: ['A project sponsor', 'A technical lead'],
                evidenceOfLearning: 'A completed analysis with evidence for each decision.',
                debriefBloomVerb: bloomVerb,
              },
            },
          ],
          transitions: ['Connect the case to the demonstration.', 'Move from the example to participant practice.'],
        };
        return new Response(JSON.stringify({
          content: [{ type: 'text', text: JSON.stringify(contract) }],
        }), { status: 200 });
      },
      onProgress: item => progress.push(item),
    });

    const output = JSON.parse(await readFile(writtenPath, 'utf8'));
    assert.equal(writtenPath, outputPath);
    assert.equal(output.count, 8);
    assert.deepEqual(output.contracts.map(item => item.language), [
      'ro', 'ro', 'ro', 'ro', 'en', 'en', 'en', 'en',
    ]);
    assert.equal(apiCalls, 8);
    assert.equal(progress.length, 8);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
