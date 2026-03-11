// server.js — SRIP Backend
// Deploy: Render (free tier) | Node 18+
// Start command: node server.js

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'SRIP Backend' }));

// ─── Main audit endpoint ─────────────────────────────────────────────────────
app.post('/audit', async (req, res) => {
  const { url, mode = 'standard' } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

    // Allow JS-heavy pages to settle
    await new Promise(r => setTimeout(r, 2000));

    const siteDNA = await runForensicAudit(page, mode);
    res.json({ success: true, url, mode, siteDNA });

  } catch (err) {
    console.error('[SRIP Error]', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// ─── Forensic Audit Orchestrator ─────────────────────────────────────────────
async function runForensicAudit(page, mode) {
  const dna = { mode, capturedAt: new Date().toISOString() };

  console.log('[SRIP] Step 1.1 — Architecture');
  dna.architecture = await step1_1_architecture(page);

  console.log('[SRIP] Step 1.2 — Design Tokens');
  dna.tokens = await step1_2_tokens(page);

  console.log('[SRIP] Step 1.3 — Section Blueprints');
  dna.sections = await step1_3_sections(page);

  console.log('[SRIP] Step 1.4 — Animations');
  dna.animations = await step1_4_animations(page);

  console.log('[SRIP] Step 1.5 — Micro-interactions');
  dna.interactions = await step1_5_interactions(page);

  console.log('[SRIP] Step 1.6 — Component Behaviors');
  dna.components = await step1_6_components(page);

  console.log('[SRIP] Step 1.7 — Scroll Choreography');
  dna.scrollMap = await step1_7_scrollChoreography(page);

  console.log('[SRIP] Step 1.8 — Tech Stack');
  dna.stack = await step1_8_techStack(page);

  console.log('[SRIP] Step 1.9 — Copy Voice');
  dna.voice = await step1_9_voice(page);

  console.log('[SRIP] Screenshots');
  dna.screenshots = await captureScrollScreenshots(page);

  return dna;
}

// ─── Step 1.1: Macro Page Architecture ───────────────────────────────────────
async function step1_1_architecture(page) {
  return page.evaluate(() => {
    const sections = document.querySelectorAll(
      'body > section, main > section, [role="main"] > section'
    );
    const topDivs = document.querySelectorAll(
      'body > div, main > div, [role="main"] > div, #__next > div > div, #app > div > div'
    );

    const strategy = sections.length >= 3 ? 'section-tags' : 'top-divs';
    const candidates = sections.length >= 3 ? sections : topDivs;

    const sectionData = Array.from(candidates)
      .filter(el => el.offsetHeight > 100)
      .map((el, i) => {
        const s = getComputedStyle(el);
        return {
          index: i,
          tag: el.tagName,
          className: el.className.substring(0, 80),
          height: el.offsetHeight,
          background: s.backgroundColor,
          backgroundImage: s.backgroundImage !== 'none'
            ? s.backgroundImage.substring(0, 300) : null,
          padding: `${s.paddingTop} / ${s.paddingBottom}`,
          display: s.display,
          heading: el.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0, 80) || null,
          isTall: el.offsetHeight > 2000,
        };
      });

    return {
      strategy,
      totalSections: sectionData.length,
      pageHeight: document.body.scrollHeight,
      viewportWidth: window.innerWidth,
      sections: sectionData,
    };
  });
}

// ─── Step 1.2: Design Token Extraction ───────────────────────────────────────
async function step1_2_tokens(page) {
  return page.evaluate(() => {
    const allEls = document.querySelectorAll('*');
    const colors = new Set();
    const fonts = new Set();

    allEls.forEach(el => {
      const s = getComputedStyle(el);
      ['color', 'backgroundColor', 'borderColor', 'outlineColor'].forEach(p => {
        const v = s[p];
        if (v && !['rgba(0, 0, 0, 0)', 'transparent', 'rgba(0,0,0,0)'].includes(v))
          colors.add(v);
      });
      if (s.fontFamily) fonts.add(s.fontFamily);
    });

    const typoSelectors = ['h1','h2','h3','h4','p','button','a','label','small','span'];
    const typography = typoSelectors.map(sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        element: sel,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        textTransform: s.textTransform,
        fontStyle: s.fontStyle,
      };
    }).filter(Boolean);

    // Border radius samples
    const radii = new Set();
    document.querySelectorAll('button, input, [class*="card"], [class*="btn"], [class*="tag"], [class*="badge"]')
      .forEach(el => {
        const r = getComputedStyle(el).borderRadius;
        if (r && r !== '0px') radii.add(r);
      });

    // Shadow samples
    const shadows = new Set();
    document.querySelectorAll('*').forEach(el => {
      const bs = getComputedStyle(el).boxShadow;
      if (bs && bs !== 'none') shadows.add(bs);
    });

    // CSS custom properties (design tokens)
    const cssVars = {};
    try {
      const root = getComputedStyle(document.documentElement);
      const sheet = document.styleSheets;
      Array.from(sheet).forEach(s => {
        try {
          Array.from(s.cssRules || []).forEach(rule => {
            if (rule.selectorText === ':root') {
              rule.style.cssText.split(';').forEach(decl => {
                const [k, v] = decl.split(':');
                if (k && k.trim().startsWith('--')) cssVars[k.trim()] = v?.trim();
              });
            }
          });
        } catch (_) {}
      });
    } catch (_) {}

    return {
      colors: [...colors].slice(0, 50),
      fonts: [...fonts].slice(0, 10),
      typography,
      borderRadii: [...radii],
      shadows: [...shadows].slice(0, 10),
      cssVariables: cssVars,
    };
  });
}

// ─── Step 1.3: Section Blueprints ────────────────────────────────────────────
async function step1_3_sections(page) {
  return page.evaluate(() => {
    const sections = document.querySelectorAll(
      'body > section, main > section, [role="main"] > section'
    );
    const candidates = sections.length >= 3
      ? sections
      : document.querySelectorAll('body > div, main > div, #__next > div > div');

    return Array.from(candidates).filter(el => el.offsetHeight > 100).map((sec, i) => {
      const s = getComputedStyle(sec);

      // Drill to content container
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
        return {
          index: ci,
          tag: child.tagName,
          className: child.className.substring(0, 80),
          height: child.offsetHeight,
          width: child.offsetWidth,
          position: cs.position,
          display: cs.display,
          background: cs.backgroundColor,
          text: child.textContent.trim().substring(0, 100),
          hasImage: !!child.querySelector('img, video, svg, canvas'),
          imageCount: child.querySelectorAll('img').length,
        };
      });

      const orphanClasses = Object.entries(classCount)
        .filter(([, count]) => count === 1)
        .map(([cls]) => cls);

      return {
        index: i,
        height: sec.offsetHeight,
        background: s.backgroundColor,
        backgroundImage: s.backgroundImage !== 'none'
          ? s.backgroundImage.substring(0, 300) : null,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        display: s.display,
        gridTemplate: s.gridTemplateColumns !== 'none' ? s.gridTemplateColumns : null,
        heading: sec.querySelector('h1,h2,h3')?.textContent?.trim()?.substring(0, 100) || null,
        isTall: sec.offsetHeight > 2000,
        children,
        orphanClasses,
        images: Array.from(sec.querySelectorAll('img')).slice(0, 5).map(img => ({
          src: img.src?.substring(0, 100),
          alt: img.alt,
          width: img.offsetWidth,
          height: img.offsetHeight,
        })),
      };
    });
  });
}

// ─── Step 1.4: Scroll & Entrance Animations ───────────────────────────────────
async function step1_4_animations(page) {
  return page.evaluate(() => {
    const animated = [];
    document.querySelectorAll('*').forEach(el => {
      const s = getComputedStyle(el);
      const hasAnim = s.animationName && s.animationName !== 'none';
      const hasTrans = s.transition && s.transition !== 'all 0s ease 0s';
      if (hasAnim || hasTrans) {
        animated.push({
          tag: el.tagName,
          className: el.className.substring(0, 60),
          animationName: s.animationName,
          animationDuration: s.animationDuration,
          animationTimingFunction: s.animationTimingFunction,
          animationDelay: s.animationDelay,
          transition: s.transition.substring(0, 200),
        });
      }
    });

    // GSAP / scroll-trigger markers
    const gsapEls = Array.from(
      document.querySelectorAll('[class*="gsap"], [data-gsap], [class*="scroll-"], [data-scroll], [data-aos]')
    ).slice(0, 20).map(el => ({
      tag: el.tagName,
      className: el.className.substring(0, 60),
      dataAttrs: Object.fromEntries(
        Array.from(el.attributes)
          .filter(a => a.name.startsWith('data-'))
          .map(a => [a.name, a.value.substring(0, 100)])
      ),
    }));

    return { animatedElements: animated.slice(0, 40), scrollTriggerElements: gsapEls };
  });
}

// ─── Step 1.5: Micro-interaction Catalog ─────────────────────────────────────
async function step1_5_interactions(page) {
  return page.evaluate(() => {
    const selectors = 'button, a, [role="button"], [class*="btn"], [class*="cta"], nav a, input, select';
    return Array.from(document.querySelectorAll(selectors)).slice(0, 25).map(el => {
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className.substring(0, 60),
        text: el.textContent.trim().substring(0, 50),
        href: el.href?.substring(0, 80) || null,
        background: s.backgroundColor,
        color: s.color,
        border: s.border,
        borderRadius: s.borderRadius,
        padding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        transition: s.transition.substring(0, 200),
        cursor: s.cursor,
        overflow: s.overflow,
        position: s.position,
        hasPseudoBefore: window.getComputedStyle(el, ':before').content !== 'none',
        hasPseudoAfter: window.getComputedStyle(el, ':after').content !== 'none',
      };
    });
  });
}

// ─── Step 1.6: Component Behavior Deep-Dive ───────────────────────────────────
async function step1_6_components(page) {
  return page.evaluate(() => {
    const components = [];

    // Nav / Header
    const nav = document.querySelector('nav, header');
    if (nav) {
      const s = getComputedStyle(nav);
      components.push({
        type: 'nav',
        position: s.position,
        background: s.backgroundColor,
        height: nav.offsetHeight,
        zIndex: s.zIndex,
        transition: s.transition.substring(0, 100),
        logoSrc: nav.querySelector('img')?.src?.substring(0, 100) || null,
        linkCount: nav.querySelectorAll('a').length,
        hasCTA: !!nav.querySelector('button, [class*="btn"]'),
      });
    }

    // Carousels / sliders
    document.querySelectorAll('[class*="carousel"], [class*="slider"], [class*="swiper"], [class*="glide"]')
      .forEach(el => components.push({
        type: 'carousel',
        className: el.className.substring(0, 60),
        childCount: el.children.length,
        height: el.offsetHeight,
      }));

    // Accordions / FAQs
    document.querySelectorAll('[class*="accordion"], details, [class*="faq"], [class*="collapse"]')
      .forEach(el => components.push({
        type: 'accordion',
        className: el.className.substring(0, 60),
        isOpen: el.open || el.classList.contains('open') || el.classList.contains('active'),
        question: el.querySelector('summary, h3, [class*="question"]')?.textContent?.trim()?.substring(0, 80) || null,
      }));

    // Typewriters / counters
    document.querySelectorAll('[class*="typewriter"], [class*="counter"], [class*="count-up"], [class*="typed"]')
      .forEach(el => components.push({
        type: 'typewriter-counter',
        className: el.className.substring(0, 60),
        text: el.textContent.trim().substring(0, 60),
      }));

    // Tabs
    document.querySelectorAll('[role="tablist"], [class*="tabs"]')
      .forEach(el => components.push({
        type: 'tabs',
        className: el.className.substring(0, 60),
        tabCount: el.querySelectorAll('[role="tab"], [class*="tab"]').length,
      }));

    // Modals / dialogs
    document.querySelectorAll('dialog, [class*="modal"], [class*="overlay"]')
      .forEach(el => components.push({
        type: 'modal',
        className: el.className.substring(0, 60),
        isVisible: getComputedStyle(el).display !== 'none',
      }));

    return components;
  });
}

// ─── Step 1.7: Scroll Choreography Map ───────────────────────────────────────
async function step1_7_scrollChoreography(page) {
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const events = [];
  const steps = 10;

  for (let i = 0; i <= steps; i++) {
    const scrollY = Math.floor((pageHeight / steps) * i);
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await new Promise(r => setTimeout(r, 400));

    const state = await page.evaluate((y, total) => {
      const pct = Math.round((y / total) * 100);
      const stickies = Array.from(document.querySelectorAll('*'))
        .filter(el => ['sticky', 'fixed'].includes(getComputedStyle(el).position))
        .map(el => ({
          tag: el.tagName,
          className: el.className.substring(0, 40),
          top: getComputedStyle(el).top,
        })).slice(0, 5);

      const visibleHeadings = Array.from(document.querySelectorAll('h1,h2,h3'))
        .filter(el => {
          const r = el.getBoundingClientRect();
          return r.top >= 0 && r.bottom <= window.innerHeight;
        })
        .map(el => el.textContent.trim().substring(0, 60))
        .slice(0, 3);

      return { scrollY: y, percentage: pct, stickyElements: stickies, visibleHeadings };
    }, scrollY, pageHeight);

    events.push(state);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  return { pageHeight, checkpoints: events };
}

// ─── Step 1.8: Technical Stack Detection ─────────────────────────────────────
async function step1_8_techStack(page) {
  return page.evaluate(() => {
    const detected = {
      gsap: typeof gsap !== 'undefined' ? (gsap.version || 'detected') : false,
      gsapScrollTrigger: typeof ScrollTrigger !== 'undefined',
      framerMotion: !!document.querySelector('[data-framer-component-type], [data-framer-name]'),
      threeJS: typeof THREE !== 'undefined',
      react: !!(document.querySelector('[data-reactroot]') || window.__REACT_DEVTOOLS_GLOBAL_HOOK__),
      nextJS: !!document.querySelector('#__NEXT_DATA__'),
      vue: !!document.querySelector('[data-v-app]'),
      nuxt: !!document.querySelector('#__nuxt'),
      alpine: typeof Alpine !== 'undefined',
      lenis: typeof Lenis !== 'undefined' || typeof lenis !== 'undefined',
      locomotive: !!document.querySelector('[data-scroll-container]'),
      tailwind: !!document.querySelector('[class*="flex-"], [class*="text-sm"], [class*="bg-"]'),
      swiper: typeof Swiper !== 'undefined',
      lottie: typeof lottie !== 'undefined' || !!document.querySelector('lottie-player, [class*="lottie"]'),
    };

    const libraryScripts = Array.from(document.querySelectorAll('script[src]'))
      .map(s => s.src)
      .filter(src => /gsap|framer|lottie|three|swiper|aos|scrollmagic|anime|motion|locomotive|lenis/i.test(src))
      .map(src => src.substring(0, 150));

    const metaGenerator = document.querySelector('meta[name="generator"]')?.content || null;
    const metaFramework = document.querySelector('meta[name="next-head-count"]') ? 'Next.js' : null;

    return { detected, libraryScripts, metaGenerator, metaFramework };
  });
}

// ─── Step 1.9: Copy Voice ────────────────────────────────────────────────────
async function step1_9_voice(page) {
  return page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
      .map(el => el.textContent.trim()).filter(Boolean).slice(0, 10);
    const paragraphs = Array.from(document.querySelectorAll('p'))
      .map(el => el.textContent.trim()).filter(t => t.length > 40).slice(0, 6);
    const ctaTexts = Array.from(document.querySelectorAll('button, [class*="cta"], [class*="btn"], a[class*="btn"]'))
      .map(el => el.textContent.trim()).filter(Boolean).slice(0, 8);
    const navLinks = Array.from(document.querySelectorAll('nav a'))
      .map(el => el.textContent.trim()).filter(Boolean).slice(0, 8);
    const motionClassCount = document.querySelectorAll(
      '[class*="animate"], [class*="motion"], [data-aos], [class*="reveal"], [class*="fade"]'
    ).length;

    return { headings, paragraphs, ctaTexts, navLinks, motionClassCount };
  });
}

// ─── Screenshots at scroll positions ─────────────────────────────────────────
async function captureScrollScreenshots(page) {
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportH = 900;
  const positions = [0, 0.25, 0.5, 0.75, 1.0];
  const screenshots = [];

  for (const pct of positions) {
    const y = Math.max(0, Math.floor((pageHeight - viewportH) * pct));
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await new Promise(r => setTimeout(r, 600));
    const data = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 72 });
    screenshots.push({ position: `${Math.round(pct * 100)}%`, scrollY: y, base64: data });
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  return screenshots;
}

app.listen(PORT, () => console.log(`[SRIP] Backend running on port ${PORT}`));
