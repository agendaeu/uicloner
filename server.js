// server.js — SRIP Backend Completo
// Deploy: Render (free tier) | Node 18+
// Start command: node server.js
// Env vars: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');
const { randomUUID } = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const CLAUDE_MODEL = 'claude-opus-4-5';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ═══════════════════════════════════════════════════════════════════════════════
// PUPPETEER HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function launchBrowser() {
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
}

async function openPage(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 2000));
  return page;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORENSIC AUDIT — 9 STEPS
// ═══════════════════════════════════════════════════════════════════════════════

async function runForensicAudit(page, mode) {
  const dna = { mode, capturedAt: new Date().toISOString() };
  console.log('[Step 1.1] Architecture');
  dna.architecture = await step1_1_architecture(page);
  console.log('[Step 1.2] Tokens');
  dna.tokens = await step1_2_tokens(page);
  console.log('[Step 1.3] Sections');
  dna.sections = await step1_3_sections(page);
  console.log('[Step 1.4] Animations');
  dna.animations = await step1_4_animations(page);
  console.log('[Step 1.5] Interactions');
  dna.interactions = await step1_5_interactions(page);
  console.log('[Step 1.6] Components');
  dna.components = await step1_6_components(page);
  console.log('[Step 1.7] Scroll map');
  dna.scrollMap = await step1_7_scrollChoreography(page);
  console.log('[Step 1.8] Stack');
  dna.stack = await step1_8_techStack(page);
  console.log('[Step 1.9] Voice');
  dna.voice = await step1_9_voice(page);
  console.log('[Screenshots]');
  dna.screenshots = await captureScrollScreenshots(page);
  return dna;
}

async function step1_1_architecture(page) {
  return page.evaluate(() => {
    const sections = document.querySelectorAll('body > section, main > section, [role="main"] > section');
    const topDivs = document.querySelectorAll('body > div, main > div, [role="main"] > div, #__next > div > div, #app > div > div');
    const strategy = sections.length >= 3 ? 'section-tags' : 'top-divs';
    const candidates = sections.length >= 3 ? sections : topDivs;
    const sectionData = Array.from(candidates).filter(el => el.offsetHeight > 100).map((el, i) => {
      const s = getComputedStyle(el);
      return {
        index: i, tag: el.tagName, className: el.className.substring(0, 80),
        height: el.offsetHeight, background: s.backgroundColor,
        backgroundImage: s.backgroundImage !== 'none' ? s.backgroundImage.substring(0, 300) : null,
        padding: `${s.paddingTop} / ${s.paddingBottom}`, display: s.display,
        heading: el.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0, 80) || null,
        isTall: el.offsetHeight > 2000,
      };
    });
    return { strategy, totalSections: sectionData.length, pageHeight: document.body.scrollHeight, sections: sectionData };
  });
}

async function step1_2_tokens(page) {
  return page.evaluate(() => {
    const allEls = document.querySelectorAll('*');
    const colors = new Set(), fonts = new Set();
    allEls.forEach(el => {
      const s = getComputedStyle(el);
      ['color', 'backgroundColor', 'borderColor'].forEach(p => {
        const v = s[p];
        if (v && !['rgba(0, 0, 0, 0)', 'transparent'].includes(v)) colors.add(v);
      });
      if (s.fontFamily) fonts.add(s.fontFamily);
    });
    const typo = ['h1','h2','h3','p','button','a','label'].map(sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { element: sel, fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, color: s.color, textTransform: s.textTransform };
    }).filter(Boolean);
    const radii = new Set(), shadows = new Set();
    document.querySelectorAll('button, input, [class*="card"], [class*="btn"]').forEach(el => {
      const r = getComputedStyle(el).borderRadius;
      if (r && r !== '0px') radii.add(r);
    });
    document.querySelectorAll('*').forEach(el => {
      const bs = getComputedStyle(el).boxShadow;
      if (bs && bs !== 'none') shadows.add(bs);
    });
    const cssVars = {};
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule.selectorText === ':root') {
              rule.style.cssText.split(';').forEach(d => {
                const [k, v] = d.split(':');
                if (k?.trim().startsWith('--')) cssVars[k.trim()] = v?.trim();
              });
            }
          });
        } catch (_) {}
      });
    } catch (_) {}
    return { colors: [...colors].slice(0, 50), fonts: [...fonts].slice(0, 10), typography: typo, borderRadii: [...radii], shadows: [...shadows].slice(0, 10), cssVariables: cssVars };
  });
}

async function step1_3_sections(page) {
  return page.evaluate(() => {
    const sections = document.querySelectorAll('body > section, main > section, [role="main"] > section');
    const candidates = sections.length >= 3 ? sections : document.querySelectorAll('body > div, main > div, #__next > div > div');
    return Array.from(candidates).filter(el => el.offsetHeight > 100).map((sec, i) => {
      const s = getComputedStyle(sec);
      let wrapper = sec;
      for (let d = 0; d < 5; d++) {
        const kids = Array.from(wrapper.children).filter(c => c.offsetHeight > 50);
        if (kids.length >= 2) break;
        if (kids.length === 1) { wrapper = kids[0]; continue; }
        break;
      }
      const classCount = {};
      const children = Array.from(wrapper.children).map((child, ci) => {
        const cs = getComputedStyle(child);
        const cls = child.className.split(' ')[0] || 'no-class';
        classCount[cls] = (classCount[cls] || 0) + 1;
        return { index: ci, tag: child.tagName, className: child.className.substring(0, 80), height: child.offsetHeight, position: cs.position, background: cs.backgroundColor, text: child.textContent.trim().substring(0, 100), hasImage: !!child.querySelector('img,video,svg,canvas') };
      });
      const orphanClasses = Object.entries(classCount).filter(([, c]) => c === 1).map(([cls]) => cls);
      return {
        index: i, height: sec.offsetHeight, background: s.backgroundColor,
        backgroundImage: s.backgroundImage !== 'none' ? s.backgroundImage.substring(0, 300) : null,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        heading: sec.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0, 100) || null,
        isTall: sec.offsetHeight > 2000, children, orphanClasses,
        images: Array.from(sec.querySelectorAll('img')).slice(0, 5).map(img => ({ src: img.src?.substring(0, 100), alt: img.alt, width: img.offsetWidth, height: img.offsetHeight })),
      };
    });
  });
}

async function step1_4_animations(page) {
  return page.evaluate(() => {
    const animated = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      const hasAnim = s.animationName && s.animationName !== 'none';
      const hasTrans = s.transition && s.transition !== 'all 0s ease 0s';
      if (hasAnim || hasTrans) animated.push({ tag: el.tagName, className: el.className.substring(0, 60), animationName: s.animationName, animationDuration: s.animationDuration, animationTimingFunction: s.animationTimingFunction, animationDelay: s.animationDelay, transition: s.transition.substring(0, 200) });
    });
    const gsapEls = Array.from(document.querySelectorAll('[class*="gsap"],[data-gsap],[data-scroll],[data-aos]')).slice(0, 20).map(el => ({ tag: el.tagName, className: el.className.substring(0, 60), dataAttrs: Object.fromEntries(Array.from(el.attributes).filter(a => a.name.startsWith('data-')).map(a => [a.name, a.value.substring(0, 100)])) }));
    return { animatedElements: animated.slice(0, 40), scrollTriggerElements: gsapEls };
  });
}

async function step1_5_interactions(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, [role="button"], [class*="btn"], [class*="cta"], input')).slice(0, 25).map(el => {
      const s = getComputedStyle(el);
      return { tag: el.tagName, className: el.className.substring(0, 60), text: el.textContent.trim().substring(0, 50), background: s.backgroundColor, color: s.color, border: s.border, borderRadius: s.borderRadius, padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`, fontSize: s.fontSize, fontWeight: s.fontWeight, transition: s.transition.substring(0, 200), cursor: s.cursor, overflow: s.overflow, hasPseudoBefore: window.getComputedStyle(el, ':before').content !== 'none' };
    });
  });
}

async function step1_6_components(page) {
  return page.evaluate(() => {
    const components = [];
    const nav = document.querySelector('nav, header');
    if (nav) {
      const s = getComputedStyle(nav);
      components.push({ type: 'nav', position: s.position, background: s.backgroundColor, height: nav.offsetHeight, zIndex: s.zIndex, transition: s.transition.substring(0, 100), linkCount: nav.querySelectorAll('a').length, hasCTA: !!nav.querySelector('button,[class*="btn"]') });
    }
    document.querySelectorAll('[class*="carousel"],[class*="slider"],[class*="swiper"]').forEach(el => components.push({ type: 'carousel', className: el.className.substring(0, 60), childCount: el.children.length, height: el.offsetHeight }));
    document.querySelectorAll('[class*="accordion"],details,[class*="faq"]').forEach(el => components.push({ type: 'accordion', className: el.className.substring(0, 60), isOpen: el.open || false, question: el.querySelector('summary,h3')?.textContent?.trim()?.substring(0, 80) || null }));
    document.querySelectorAll('[class*="typewriter"],[class*="counter"],[class*="typed"]').forEach(el => components.push({ type: 'typewriter-counter', className: el.className.substring(0, 60), text: el.textContent.trim().substring(0, 60) }));
    document.querySelectorAll('[role="tablist"],[class*="tabs"]').forEach(el => components.push({ type: 'tabs', className: el.className.substring(0, 60), tabCount: el.querySelectorAll('[role="tab"],[class*="tab"]').length }));
    return components;
  });
}

async function step1_7_scrollChoreography(page) {
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const events = [];
  for (let i = 0; i <= 10; i++) {
    const scrollY = Math.floor((pageHeight / 10) * i);
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await new Promise(r => setTimeout(r, 400));
    const state = await page.evaluate((y, total) => {
      const stickies = Array.from(document.querySelectorAll('*')).filter(el => ['sticky','fixed'].includes(getComputedStyle(el).position)).map(el => ({ tag: el.tagName, className: el.className.substring(0, 40), top: getComputedStyle(el).top })).slice(0, 5);
      const visibleHeadings = Array.from(document.querySelectorAll('h1,h2,h3')).filter(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }).map(el => el.textContent.trim().substring(0, 60)).slice(0, 3);
      return { scrollY: y, percentage: Math.round((y / total) * 100), stickyElements: stickies, visibleHeadings };
    }, scrollY, pageHeight);
    events.push(state);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return { pageHeight, checkpoints: events };
}

async function step1_8_techStack(page) {
  return page.evaluate(() => {
    const detected = {
      gsap: typeof gsap !== 'undefined' ? (gsap.version || 'detected') : false,
      gsapScrollTrigger: typeof ScrollTrigger !== 'undefined',
      framerMotion: !!document.querySelector('[data-framer-component-type]'),
      threeJS: typeof THREE !== 'undefined',
      react: !!(document.querySelector('[data-reactroot]') || window.__REACT_DEVTOOLS_GLOBAL_HOOK__),
      nextJS: !!document.querySelector('#__NEXT_DATA__'),
      vue: !!document.querySelector('[data-v-app]'),
      alpine: typeof Alpine !== 'undefined',
      lenis: typeof Lenis !== 'undefined' || typeof lenis !== 'undefined',
      tailwind: !!document.querySelector('[class*="flex-"],[class*="text-sm"]'),
      swiper: typeof Swiper !== 'undefined',
      lottie: typeof lottie !== 'undefined' || !!document.querySelector('lottie-player'),
    };
    const libraryScripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src).filter(src => /gsap|framer|lottie|three|swiper|aos|anime|locomotive|lenis/i.test(src)).map(s => s.substring(0, 150));
    return { detected, libraryScripts, metaGenerator: document.querySelector('meta[name="generator"]')?.content || null };
  });
}

async function step1_9_voice(page) {
  return page.evaluate(() => ({
    headings: Array.from(document.querySelectorAll('h1,h2,h3')).map(el => el.textContent.trim()).filter(Boolean).slice(0, 10),
    paragraphs: Array.from(document.querySelectorAll('p')).map(el => el.textContent.trim()).filter(t => t.length > 40).slice(0, 6),
    ctaTexts: Array.from(document.querySelectorAll('button,[class*="cta"],[class*="btn"]')).map(el => el.textContent.trim()).filter(Boolean).slice(0, 8),
    navLinks: Array.from(document.querySelectorAll('nav a')).map(el => el.textContent.trim()).filter(Boolean).slice(0, 8),
    motionClassCount: document.querySelectorAll('[class*="animate"],[class*="motion"],[data-aos],[class*="reveal"],[class*="fade"]').length,
  }));
}

async function captureScrollScreenshots(page) {
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const screenshots = [];
  for (const pct of [0, 0.25, 0.5, 0.75, 1.0]) {
    const y = Math.max(0, Math.floor((pageHeight - 900) * pct));
    await page.evaluate(sy => window.scrollTo(0, sy), y);
    await new Promise(r => setTimeout(r, 600));
    const data = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 72 });
    screenshots.push({ position: `${Math.round(pct * 100)}%`, scrollY: y, base64: data });
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  return screenshots;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAUDE API HELPER
// ═══════════════════════════════════════════════════════════════════════════════

async function callClaude(systemPrompt, userContent, maxTokens = 8000) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: userContent }] }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content.map(b => b.text || '').join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function savePlan(runId, filename, content) {
  const { error } = await supabase.storage.from('srip-plans').upload(`${runId}/${filename}`, content, { contentType: 'text/markdown', upsert: true });
  if (error) console.error(`[Supabase] ${filename}:`, error.message);
}

async function saveScreenshots(runId, screenshots) {
  for (const shot of screenshots) {
    const buf = Buffer.from(shot.base64, 'base64');
    await supabase.storage.from('srip-plans').upload(`${runId}/screenshots/scroll-${shot.position}.jpg`, buf, { contentType: 'image/jpeg', upsert: true });
  }
}

async function createRun(runId, url, mode) {
  await supabase.from('runs').insert({ id: runId, url, mode, status: 'running', created_at: new Date().toISOString() });
}

async function updateRun(runId, fields) {
  await supabase.from('runs').update(fields).eq('id', runId);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIPELINE — 4 PHASES + ITERATOR
// ═══════════════════════════════════════════════════════════════════════════════

const PHASE1_SYSTEM = `You are a Senior UI Forensics Expert running Phase 1 of SRIP.
You receive raw Puppeteer data and produce a structured Site DNA document.
Apply the Anti-Flattening Doctrine: every color includes hex + usage context,
every animation includes timing and easing, every component has enough detail
to rebuild without seeing the original.
Structure output as Markdown with sections 1.1 through 1.9.
High-Fidelity: ASCII wireframes, t=Xms timelines, property diff tables, state machines.
Standard: detailed narrative with all values inline.
Begin with: AUDIT_MODE: [standard|high-fidelity]`;

async function phase1_forensicAudit(runId, rawDNA, mode, screenshots) {
  const screenshotMeta = screenshots.map(s => `Screenshot at ${s.position} scroll (y=${s.scrollY}px)`).join('\n');
  const siteDNA = await callClaude(PHASE1_SYSTEM,
    `AUDIT_MODE: ${mode}\n\nRAW PUPPETEER DATA:\n${JSON.stringify(rawDNA, null, 2)}\n\nSCREENSHOTS:\n${screenshotMeta}\n\nSynthesize into complete Site DNA.`,
    10000
  );
  await savePlan(runId, '01-site-dna.md', siteDNA);
  await updateRun(runId, { phase: 1, status: 'phase1_complete' });
  return siteDNA;
}

async function phase2_saveBrandInterview(runId, answers) {
  const questions = ['PRODUCT IDENTITY','AUDIENCE PERSONA','BRAND FEELING','COLOR PALETTE','PAGE SECTIONS','PRIMARY HEADLINE','PRIMARY CTA','KEY DIFFERENTIATOR','ANIMATION INTENSITY','TECH STACK','CONTENT ASSETS','SECTION MODIFICATIONS'];
  const doc = `# Brand Interview\nRun: ${runId}\n\n` + questions.map((q, i) => `## Q${i + 1}. ${q}\n${answers[i] || '_No answer_'}`).join('\n\n');
  await savePlan(runId, '02-brand-interview.md', doc);
  await updateRun(runId, { phase: 2, status: 'phase2_complete' });
  return doc;
}

const PHASE3_SYSTEM = `You are a World-Class Senior Creative Technologist running SRIP Phase 3 — Synthesis.
Generate a complete, self-contained replication prompt optimized for the target tool.
Apply all 11 Synthesis Rules: structure, embed artifacts (HF), aesthetic identity, design system,
component naming, pseudocode specs, color role mapping, copy voice adaptation, animation intensity,
technical requirements block, execution directive.
Output the complete prompt in a single fenced code block.`;

async function phase3_synthesis(runId, siteDNA, brandInterview, targetTool, mode) {
  const prompt = await callClaude(PHASE3_SYSTEM,
    `AUDIT_MODE: ${mode}\nTARGET TOOL: ${targetTool}\n\n## SITE DNA\n${siteDNA}\n\n## BRAND INTERVIEW\n${brandInterview}`,
    12000
  );
  await savePlan(runId, '03-replication-prompt.md', prompt);
  await updateRun(runId, { phase: 3, status: 'phase3_complete' });
  return prompt;
}

const PHASE4_SYSTEM = `You are a SRIP Quality Auditor running Phase 4 — Quality Self-Check.
Verify the replication prompt against the full fidelity checklist.
For every missing item, generate the content and insert it.
Enforce zero generic language: replace "some animation", "nice hover", "smooth transition",
"add padding", "use a gradient", "make it feel premium" with exact values.
Output: brief checklist of items passed/patched, then the final verified prompt in a fenced code block.`;

async function phase4_qualityCheck(runId, replicationPrompt, mode) {
  const finalPrompt = await callClaude(PHASE4_SYSTEM,
    `AUDIT_MODE: ${mode}\n\n## REPLICATION PROMPT\n${replicationPrompt}`,
    12000
  );
  await savePlan(runId, '04-final-prompt.md', finalPrompt);
  await updateRun(runId, { phase: 4, status: 'complete', completed_at: new Date().toISOString() });
  return finalPrompt;
}

const ITERATOR_SYSTEM = `You are a SRIP Refinement Specialist running the UI Cloner Iterator — 5 passes.
Pass 1: Foundation (color, typography, background)
Pass 2: Layout & Spacing (grid, whitespace, card geometry)
Pass 3: Component Fidelity (nav, cards, FAQ, footer)
Pass 4: Motion & Animation (scroll triggers, hover states, timing)
Pass 5: Voice & Polish (copy structure, remaining visual polish)
Each pass: COMPARE → PRIORITIZE [CRITICAL/MAJOR/MINOR] → GENERATE corrective prompt → ADVANCE.
End with Master Correction Summary and single Final Dial-In Prompt.
Rules: never skip a pass, every corrective prompt is self-contained, cite exact Site DNA values.`;

async function runIterator(runId, siteDNA, currentImplementation) {
  const output = await callClaude(ITERATOR_SYSTEM,
    `## SITE DNA\n${siteDNA}\n\n## CURRENT IMPLEMENTATION\n${currentImplementation}`,
    12000
  );
  await savePlan(runId, '05-iterator.md', output);
  await updateRun(runId, { status: 'iterated' });
  return output;
}

async function runFullPipeline({ runId, url, mode, rawDNA, screenshots, brandAnswers, targetTool = 'Claude' }) {
  await createRun(runId, url, mode);
  await saveScreenshots(runId, screenshots);
  const siteDNA = await phase1_forensicAudit(runId, rawDNA, mode, screenshots);
  const brandInterview = await phase2_saveBrandInterview(runId, brandAnswers);
  const replicationPrompt = await phase3_synthesis(runId, siteDNA, brandInterview, targetTool, mode);
  const finalPrompt = await phase4_qualityCheck(runId, replicationPrompt, mode);
  return { success: true, runId, siteDNA, brandInterview, replicationPrompt, finalPrompt };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'SRIP Backend' }));

// Audit only (Puppeteer — sem pipeline)
app.post('/audit', async (req, res) => {
  const { url, mode = 'standard' } = req.body;
  if (!url) return res.status(400).json({ error: 'URL obrigatória' });
  let browser;
  try {
    browser = await launchBrowser();
    const page = await openPage(browser, url);
    const siteDNA = await runForensicAudit(page, mode);
    res.json({ success: true, url, mode, siteDNA });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Pipeline completo (audit + 4 fases)
app.post('/pipeline/run', async (req, res) => {
  const { url, mode = 'standard', brandAnswers, targetTool = 'Claude' } = req.body;
  if (!url || !brandAnswers) return res.status(400).json({ error: 'url e brandAnswers são obrigatórios' });

  const runId = randomUUID();
  res.json({ runId, status: 'started' }); // Responde imediatamente ao frontend

  // Roda em background
  (async () => {
    let browser;
    try {
      browser = await launchBrowser();
      const page = await openPage(browser, url);
      const rawDNA = await runForensicAudit(page, mode);
      await browser.close(); browser = null;
      await runFullPipeline({ runId, url, mode, rawDNA, screenshots: rawDNA.screenshots, brandAnswers, targetTool });
    } catch (err) {
      console.error(`[Pipeline Error] ${runId}:`, err.message);
      await updateRun(runId, { status: 'error', error: err.message });
      if (browser) await browser.close();
    }
  })();
});

// Status do run
app.get('/pipeline/status/:runId', async (req, res) => {
  const { data, error } = await supabase.from('runs').select('*').eq('id', req.params.runId).single();
  if (error) return res.status(404).json({ error: 'Run não encontrado' });
  res.json(data);
});

// Resultado final (lista arquivos do run)
app.get('/pipeline/result/:runId', async (req, res) => {
  const { data, error } = await supabase.storage.from('srip-plans').list(req.params.runId);
  if (error) return res.status(404).json({ error: 'Run não encontrado' });
  // Retorna URLs públicas de cada arquivo
  const files = (data || []).map(f => ({
    name: f.name,
    url: supabase.storage.from('srip-plans').getPublicUrl(`${req.params.runId}/${f.name}`).data.publicUrl,
  }));
  res.json({ runId: req.params.runId, files });
});

// Iterator — refinamento pós-build
app.post('/pipeline/iterate', async (req, res) => {
  const { runId, currentImplementation } = req.body;
  if (!runId || !currentImplementation) return res.status(400).json({ error: 'runId e currentImplementation obrigatórios' });
  try {
    const { data, error } = await supabase.storage.from('srip-plans').download(`${runId}/01-site-dna.md`);
    if (error) return res.status(404).json({ error: 'Site DNA não encontrado para este run' });
    const siteDNA = await data.text();
    const output = await runIterator(runId, siteDNA, currentImplementation);
    res.json({ success: true, runId, iteratorOutput: output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => console.log(`[SRIP] Backend rodando na porta ${PORT}`));
