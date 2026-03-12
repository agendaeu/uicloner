// pipeline.js — SRIP Claude API Pipeline
// Add to server.js: const pipeline = require('./pipeline');
// Requires: ANTHROPIC_API_KEY and SUPABASE_* env vars

const { createClient } = require('@supabase/supabase-js');

const CLAUDE_MODEL = 'claude-opus-4-5';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Anthropic API helper ────────────────────────────────────────────────────
async function callClaude(systemPrompt, userContent, maxTokens = 8000) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content.map(b => b.text || '').join('');
}

// ─── Supabase Storage: save plan file ────────────────────────────────────────
async function savePlan(runId, filename, content) {
  const { error } = await supabase.storage
    .from('srip-plans')
    .upload(`${runId}/${filename}`, content, {
      contentType: 'text/markdown',
      upsert: true,
    });
  if (error) console.error(`[Supabase] Failed to save ${filename}:`, error.message);
}

async function saveScreenshots(runId, screenshots) {
  for (const shot of screenshots) {
    const buf = Buffer.from(shot.base64, 'base64');
    const { error } = await supabase.storage
      .from('srip-plans')
      .upload(`${runId}/screenshots/scroll-${shot.position}.jpg`, buf, {
        contentType: 'image/jpeg',
        upsert: true,
      });
    if (error) console.error(`[Supabase] Screenshot upload error:`, error.message);
  }
}

// ─── Supabase DB: run record ──────────────────────────────────────────────────
async function createRun(runId, url, mode) {
  await supabase.from('runs').insert({
    id: runId,
    url,
    mode,
    status: 'running',
    created_at: new Date().toISOString(),
  });
}

async function updateRun(runId, fields) {
  await supabase.from('runs').update(fields).eq('id', runId);
}

// ─── PHASE 1: Forensic Audit → Site DNA ──────────────────────────────────────
const PHASE1_SYSTEM = `You are a Senior UI Forensics Expert running Phase 1 of the 
Site Replication Intelligence Protocol (SRIP). You receive raw data captured by 
Puppeteer from a target website and produce a structured Site DNA document.

Your output MUST follow the Anti-Flattening Doctrine: every color must include its 
hex code and usage context, every animation must include timing and easing values, 
every component must be described with enough detail that a developer could rebuild 
it without seeing the original.

Structure your output as a Markdown document with these sections:
## SITE DNA
### 1.1 Macro Page Architecture
### 1.2 Design Tokens
### 1.3 Section Blueprints
### 1.4 Animation Audit
### 1.5 Micro-Interaction Catalog
### 1.6 Component Behaviors
### 1.7 Scroll Choreography Map
### 1.8 Technical Stack
### 1.9 Motion Philosophy & Copy Voice

For High-Fidelity mode: produce ASCII wireframes for every section, animation 
timelines with t=Xms notation, property diff tables for interactions, and state 
machines for stateful components.

For Standard mode: produce detailed narrative descriptions with all extracted values 
inline (hex codes, timing estimates, named components).

Begin with: AUDIT_MODE: [standard|high-fidelity]`;

async function phase1_forensicAudit(runId, rawDNA, mode, screenshots) {
  console.log(`[Phase 1] Synthesizing Site DNA for run ${runId}`);

  // Attach screenshot descriptions (base64 too large for context, describe positions)
  const screenshotMeta = screenshots.map(s =>
    `Screenshot at ${s.position} scroll (y=${s.scrollY}px) — captured`
  ).join('\n');

  const userContent = `AUDIT_MODE: ${mode}

RAW PUPPETEER DATA:
${JSON.stringify(rawDNA, null, 2)}

SCREENSHOTS CAPTURED:
${screenshotMeta}

Synthesize this raw data into a complete Site DNA document following all 9 steps. 
Apply the Anti-Flattening Doctrine — no vague summaries, every value must be precise.`;

  const siteDNA = await callClaude(PHASE1_SYSTEM, userContent, 10000);
  await savePlan(runId, '01-site-dna.md', siteDNA);
  await updateRun(runId, { phase: 1, status: 'phase1_complete' });

  console.log(`[Phase 1] Site DNA saved.`);
  return siteDNA;
}

// ─── PHASE 2: Brand Interview ─────────────────────────────────────────────────
// Phase 2 is interactive — the 12 questions are presented to the user in the
// frontend. This function just formats and saves the answers.
async function phase2_saveBrandInterview(runId, answers) {
  console.log(`[Phase 2] Saving brand interview for run ${runId}`);

  const questions = [
    'PRODUCT IDENTITY',
    'AUDIENCE PERSONA',
    'BRAND FEELING',
    'COLOR PALETTE',
    'PAGE SECTIONS',
    'PRIMARY HEADLINE',
    'PRIMARY CTA',
    'KEY DIFFERENTIATOR',
    'ANIMATION INTENSITY',
    'TECH STACK',
    'CONTENT ASSETS',
    'SECTION MODIFICATIONS',
  ];

  const doc = `# Brand Interview\nRun: ${runId}\n\n` +
    questions.map((q, i) => `## Q${i + 1}. ${q}\n${answers[i] || '_No answer provided_'}`).join('\n\n');

  await savePlan(runId, '02-brand-interview.md', doc);
  await updateRun(runId, { phase: 2, status: 'phase2_complete' });

  console.log(`[Phase 2] Brand interview saved.`);
  return doc;
}

// ─── PHASE 3: Synthesis → Replication Prompt ─────────────────────────────────
const PHASE3_SYSTEM = `You are a World-Class Senior Creative Technologist and Lead 
Frontend Engineer running Phase 3 of SRIP — the Synthesis phase.

You have the Site DNA (Phase 1) and Brand Interview (Phase 2). Generate a complete, 
self-contained replication prompt a developer can paste directly into Claude, Cursor, 
Bolt, v0, Framer, or Webflow AI to build the site.

APPLY ALL 11 SYNTHESIS RULES:
1. Output structure: Role + Aesthetic Identity → Design System → Component Architecture → Technical Requirements → Execution Directive
2. EMBED artifacts directly (HF mode): ASCII wireframes, t=Xms timelines, state machines, property diff tables
3. Name the Aesthetic Identity in 5–8 poetic words derived from brand adjectives + motion philosophy
4. Build a named Design System: semantic palette (Name + Word + Hex), typography roles with usage rules, texture spec
5. Name every component as an artifact: [Evocative Adjective/Noun] + [Functional Description]
6. Write pseudocode-level interaction specs (Standard mode): exact timing, cubic-bezier, state logic, JS patterns
7. Map reference color ROLES to user palette — never randomly reassign
8. Adapt copy voice: preserve rhetorical structure, replace substance
9. Adapt animation intensity per user's 1–5 selection
10. Technical requirements block: stack, libraries, lifecycle, scroll setup, hover impl, font loading, image sources
11. End with an italicized Execution Directive — a philosophical sentence about HOW to feel while building

Output the complete prompt in a single fenced code block after your synthesis.`;

async function phase3_synthesis(runId, siteDNA, brandInterview, targetTool, mode) {
  console.log(`[Phase 3] Generating replication prompt for run ${runId}`);

  const userContent = `AUDIT_MODE: ${mode}
TARGET TOOL: ${targetTool}

## SITE DNA (Phase 1 Output)
${siteDNA}

## BRAND INTERVIEW (Phase 2 Output)
${brandInterview}

Generate the complete replication prompt following all 11 Synthesis Rules.
Optimize the output prompt specifically for ${targetTool}.`;

  const replicationPrompt = await callClaude(PHASE3_SYSTEM, userContent, 12000);
  await savePlan(runId, '03-replication-prompt.md', replicationPrompt);
  await updateRun(runId, { phase: 3, status: 'phase3_complete' });

  console.log(`[Phase 3] Replication prompt saved.`);
  return replicationPrompt;
}

// ─── PHASE 4: Quality Check ───────────────────────────────────────────────────
const PHASE4_SYSTEM = `You are a SRIP Quality Auditor running Phase 4 — the final 
Quality Self-Check before delivery.

Check the replication prompt against ALL items in the fidelity checklist. 
For every missing item, generate the missing content and insert it.

CORE CHECKLIST (both modes):
- Named aesthetic identity (5–8 word poetic description)
- Complete design system (semantic name + descriptive word + hex per color)
- Every section has a poetic component name using [Adjective/Noun] + [Function] formula
- Every interactive component has implementation-level behavior spec
- At least one cubic-bezier or timing value per animated component
- Color hierarchy preserved (reference roles mapped to user palette)
- Technical requirements section explicit (stack, libraries, lifecycle, fonts, images)
- Execution directive as the final line (italicized philosophical sentence)

ZERO GENERIC LANGUAGE — scan and replace every instance of:
"some animation" / "nice hover effect" / "smooth transition" / "add appropriate padding" 
/ "use a gradient" / "make it feel premium" / "add content here" / "similar to"

Also replace all flattening patterns:
- "Shows [device] with [app]" → describe every element individually
- "Large animation" → dimensions, element count, arrangement
- "Warm palette" → every color with hex and role
- "Text animates in" → per-word/line, stagger, easing, duration

Output: the final verified prompt in a single fenced code block, preceded by a brief 
checklist confirming all items passed (or listing what was patched).`;

async function phase4_qualityCheck(runId, replicationPrompt, mode) {
  console.log(`[Phase 4] Running quality check for run ${runId}`);

  const userContent = `AUDIT_MODE: ${mode}

## REPLICATION PROMPT TO VERIFY
${replicationPrompt}

Run the full fidelity checklist. Patch any missing items. 
Output the verified final prompt in a fenced code block.`;

  const finalPrompt = await callClaude(PHASE4_SYSTEM, userContent, 12000);
  await savePlan(runId, '04-final-prompt.md', finalPrompt);
  await updateRun(runId, { phase: 4, status: 'complete' });

  console.log(`[Phase 4] Final prompt saved.`);
  return finalPrompt;
}

// ─── ITERATOR: 5-Pass Refinement ─────────────────────────────────────────────
const ITERATOR_SYSTEM = `You are a SRIP Refinement Specialist running the 
UI Cloner Iterator — 5 structured passes comparing the current implementation 
against the Site DNA to produce corrective prompts.

For each pass:
1. COMPARE — scan current implementation vs Site DNA
2. PRIORITIZE — rank top 3 gaps: [CRITICAL] / [MAJOR] / [MINOR]
3. GENERATE — write a precise, self-contained corrective prompt citing exact values
4. ADVANCE — note what was addressed, what remains

PASS FOCUS AREAS:
Pass 1 — Foundation: color palette, typography, background atmosphere
Pass 2 — Layout & Spacing: section structure, grid, whitespace, card geometry  
Pass 3 — Component Fidelity: nav, cards, stats, FAQ, footer accuracy
Pass 4 — Motion & Animation: entrance animations, scroll triggers, hover states
Pass 5 — Voice & Polish: copy structure, italic patterns, remaining visual polish

After Pass 5: output a Master Correction Summary with a single consolidated 
"Final Dial-In Prompt" combining the most critical unfixed items.

RULES:
- Never skip a pass even if implementation looks good
- Every corrective prompt must be self-contained
- Every correction must cite exact values from the Site DNA
- Do not re-audit already-corrected gaps in subsequent passes`;

async function runIterator(runId, siteDNA, currentImplementation) {
  console.log(`[Iterator] Running 5-pass refinement for run ${runId}`);

  const userContent = `## SITE DNA
${siteDNA}

## CURRENT IMPLEMENTATION
${currentImplementation}

Run all 5 refinement passes. Produce corrective prompts for each. 
End with a Master Correction Summary and Final Dial-In Prompt.`;

  const iteratorOutput = await callClaude(ITERATOR_SYSTEM, userContent, 12000);
  await savePlan(runId, '05-iterator.md', iteratorOutput);
  await updateRun(runId, { status: 'iterated' });

  console.log(`[Iterator] 5-pass refinement saved.`);
  return iteratorOutput;
}

// ─── Full Pipeline Orchestrator ───────────────────────────────────────────────
async function runFullPipeline({
  runId,
  url,
  mode,
  rawDNA,
  screenshots,
  brandAnswers,
  targetTool = 'Claude',
}) {
  try {
    await createRun(runId, url, mode);
    await saveScreenshots(runId, screenshots);

    // Phase 1 — Site DNA
    const siteDNA = await phase1_forensicAudit(runId, rawDNA, mode, screenshots);

    // Phase 2 — Brand Interview (answers come from frontend)
    const brandInterview = await phase2_saveBrandInterview(runId, brandAnswers);

    // Phase 3 — Synthesis
    const replicationPrompt = await phase3_synthesis(
      runId, siteDNA, brandInterview, targetTool, mode
    );

    // Phase 4 — Quality Check
    const finalPrompt = await phase4_qualityCheck(runId, replicationPrompt, mode);

    await updateRun(runId, { status: 'complete', completed_at: new Date().toISOString() });

    return { success: true, runId, siteDNA, brandInterview, replicationPrompt, finalPrompt };

  } catch (err) {
    console.error(`[Pipeline Error] Run ${runId}:`, err.message);
    await updateRun(runId, { status: 'error', error: err.message });
    throw err;
  }
}

module.exports = {
  runFullPipeline,
  phase1_forensicAudit,
  phase2_saveBrandInterview,
  phase3_synthesis,
  phase4_qualityCheck,
  runIterator,
};
