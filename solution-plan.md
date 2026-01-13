Overall Analysis as a Senior Software DeveloperWith over 15 years of experience in full-stack development, particularly with React-based frameworks like Next.js, TypeScript, and DOM manipulation libraries (including jsdom), I've dealt with similar issues in templating engines and content injection systems. This problem stems from a classic trade-off: moving from a brittle regex-based approach to a more structured DOM-based one, but introducing new regressions due to assumptions about template uniformity and aggressive mutations.The core issue is that HTML templates from sources like HTML5 UP are not standardized—each has unique structures, class names, IDs, and quirks. The regex approach was fragile because it required exhaustive pattern matching for placeholders, but it preserved the original HTML string intact. The DOM approach is theoretically better for targeted updates, but jsdom's parsing and serialization can introduce subtle changes (e.g., whitespace normalization, attribute reordering), and your implementation is too destructive in places (e.g., overwriting textContent or innerHTML, removing elements outright).This has led to:Regressions in reliability: Blank pages for certain templates due to path resolution failures.
Loss of structure: Missing sections because selectors aren't comprehensive, and mutations don't preserve nested content.
Scalability concerns: With 10 templates, a one-size-fits-all DOM handler won't scale without template-specific logic.

The good news is that the DOM approach is salvageable with refinements—it's more maintainable long-term than regex. Reverting fully to regex would be a step back, as it doesn't handle structural changes well (e.g., adding/removing sections). A hybrid or templated-specific strategy is ideal.Key strengths in your current setup:You're using jsdom correctly for parsing.
Logging is decent, providing clues like file sizes and replacement counts.
The architecture flow is clean; issues are isolated to injection and mapping.

Potential risks if not addressed:User trust erosion (blank pages are catastrophic UX).
Maintenance debt: As templates evolve or new ones are added, fixes will pile up.
Performance: Repeated DOM parsing could slow down if scaled to high traffic.

Now, let's dive into each problem with deeper technical insights, then outline a prioritized plan of action.Detailed Problem BreakdownProblem 1: Blank Page Regression - Template Name MappingThis is a critical blocker—users get nothing, which is worse than placeholder text. The root cause is a mismatch in how templateId is handled, leading to incorrect file paths (e.g., "Solid-state" instead of "Solid State").Deeper Insights:Case Sensitivity and Normalization: JavaScript object keys are case-sensitive, so if templateId arrives as "Solid-State" or with extra chars (e.g., from URL params or JSON parsing), it won't match. The fallback capitalization logic assumes kebab-case without spaces or hyphens, which fails for "solid-state".
Upstream Sources: templateId likely originates from the frontend (e.g., TemplateGallery.tsx) where it might be derived from file names, user selections, or API responses. If it's URL-encoded or capitalized there, it propagates.
File System Sensitivity: Windows paths (as in your log: C:\Users\aless\...) are case-insensitive, but your mapping injects spaces/hyphens incorrectly, leading to ENOENT errors.
Why Fallback Triggers: The map has the correct key ('solid-state'), so non-matching suggests templateId is altered (e.g., 'solidState' or 'Solid-state'). Add type checks—templateId could be null/undefined.

Problem 2: DOM Parsing Altering Template Structurejsdom is great for server-side DOM ops but isn't a perfect browser emulator. Serialization (via dom.serialize()) can change the output HTML subtly, which compounds with CSS inlining.Deeper Insights:Serialization Quirks: jsdom defaults to XHTML-style self-closing tags (<br/>), which might break older templates expecting HTML4/5. Whitespace normalization can collapse multiple spaces, affecting layouts reliant on pre-formatted text.
Entity Handling: If templates have   or other entities, they might decode/encode differently, leading to visual glitches.
Evidence from Logs: The size increase (8KB HTML + 58KB CSS = 68KB) is fine, but if DOCTYPE or comments are stripped, it could invalidate HTML or remove template credits unintentionally.
Cross-Template Variance: HTML5 UP templates vary—some use HTML5 semantics (<section>, <nav>), others div-based. jsdom handles this well, but your mutations don't account for it.

Problem 3: Missing Template ElementsUser reports indicate partial successes (images work) but structural failures (no menu/hero). This points to overly broad or narrow selectors and destructive updates.Deeper Insights:Selector Specificity: querySelectorAll('nav a, #nav a, .menu a') covers common cases but misses templates using <ul class="nav"> or <header> nav. Hero might be #banner, .hero, or #intro.
Destructive Mutations: textContent = ... wipes nested nodes (e.g., if H1 has <span>Placeholder</span>, the span is lost). remove() breaks parent structures (e.g., empty <nav> might collapse). innerHTML = ... in footers discards classes/IDs needed for styling.
Image Placement: Global querySelectorAll('img') might replace all images, but without section-specific logic, they end up misplaced (e.g., not under hero).
Template Quirks: Solid State uses skel.js for responsive grids, which might interact poorly with DOM changes. Phantom is simpler, explaining why it "works" better.

Plan of Action for FixesI'll structure this as a phased roadmap with priorities, timelines (assuming a solo dev or small team), and responsibilities. Prioritize based on impact: Fix blank pages first (P0), then missing elements (P1), then refinements (P2). Use Git branches for each phase (e.g., fix/template-mapping).Phase 1: Immediate Hotfix for Blank Pages (Priority: P0, Timeline: 1-2 days)Goal: Ensure all templates load without errors, even if content injection is imperfect.Normalize Template IDs:In app/api/generate-website/route.ts (lines 109-130), add:typescript

const normalizedId = templateId?.trim().toLowerCase().replace(/\s+/g, '-'); // Handle spaces/hyphens
const templateName = templateNameMap[normalizedId] ||
  Object.values(templateNameMap).find(name => name.toLowerCase().replace(/\s+/g, '-') === normalizedId) || // Reverse lookup
  normalizedId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); // Better fallback

Update map keys to lowercase kebab-case consistently.

Add Robust Logging and Error Handling:Insert debug logs as you suggested, plus:typescript

if (!templateNameMap[normalizedId]) {
  console.warn(`⚠️ Template ID "${templateId}" normalized to "${normalizedId}" not found in map. Using fallback: "${templateName}"`);
}

If files not found, fallback to a default template (e.g., 'Alpha') with a user-facing message in HTML: <body><h1>Template Error - Using Default</h1>...</body>.

Test:Manually test Solid State: Send API request with templateId: 'solid-state', verify path resolves to Solid State/index.html.
Automate: Add a Jest test for mapping function covering variants ('solid-state', 'Solid State', 'SOLID-STATE').

Deploy: Push as hotfix commit, monitor logs for 24 hours.

Phase 2: Fix Missing Elements and Preserve Structure (Priority: P1, Timeline: 3-5 days)Goal: Restore menu, hero, and image positioning without breaking other templates.Refine DOM Mutations:Preserve nested content: Replace your textContent logic with node-targeted updates (as in your Option 2 example).
For removals: Instead of remove(), use link.style.display = 'none'; or add a class .hidden { display: none; }.
For footers/menus: Use innerHTML only as last resort; prefer updating text nodes:typescript

const textNodes = footer.querySelectorAll('p.copyright'); // More specific
textNodes.forEach(node => node.textContent = `© ${businessName}. All rights reserved.`);

Expand Selectors:Menu: Add more like header a, ul.nav a, .navigation a.
Hero: Target #banner, .hero, #intro, section:first-of-type.
Images: Section-specific: document.querySelector('#hero img')?.setAttribute('src', heroImage);.

Template-Specific Handlers (Your Option 4):Implement a switch in injectContent():typescript

function injectContent(dom: JSDOM, content: Content, templateName: string) {
  const handlers = {
    'Solid State': injectSolidState,
    'Phantom': injectPhantom,
    // Default: generic
  };
  const handler = handlers[templateName] || injectGeneric;
  return handler(dom, content);
}

Start with Solid State and Phantom; clone generic logic and tweak selectors.

Test:Expand your testing matrix to all 10 templates.
Add visual diffs: Use Puppeteer to screenshot original vs. generated HTML, compare.
Unit tests for injectContent(): Mock jsdom with sample HTML snippets.

Phase 3: Long-Term Improvements (Priority: P2, Timeline: 1-2 weeks)Goal: Make the system robust and scalable.Hybrid Approach (Your Option 3):Use DOM to identify elements/selectors.
Then, serialize back to string and use targeted regex for replacements (e.g., via replace() on substrings) to avoid serialization issues.

Comprehensive Testing Suite:Integration tests: API endpoint with mock Supabase/OpenAI.
E2E: Cypress for frontend template selection to generated output.
Coverage: Aim for 80% on template-system.ts.

Documentation and Monitoring:Create a TEMPLATES.md with each template's structure (selectors, quirks).
Add Sentry for error tracking on production failures.

Performance Optimizations:Cache parsed DOMs if templates are static.
Profile jsdom usage—it's CPU-heavy for large templates.

Resource EstimatesTools: Jest/Puppeteer for testing, Prettier/ESLint for code consistency.
Team: If solo, focus on Phases 1-2 first. Involve a QA if available for matrix testing.
Risks: Over-customization per template could lead to duplication; mitigate with shared utilities.

Answers to Your Questions for DeveloperPriority: Fix the blank page issue first—it's a complete failure state. Address missing menu/hero next, as they affect usability but at least show content.
Approach: Stick with refined DOM parsing (less aggressive, with hybrids where needed). Revert to regex only as a temporary rollback if Phase 2 fails.
Testing: Yes, absolutely—systematically test all 10 templates using the expanded matrix. Automate where possible to prevent future regressions.
Acceptable Tradeoffs: Minor losses in template-specific features (e.g., a fancy animation) are okay if core content (menu, hero, images) works. Prioritize consistency across templates over pixel-perfection.

This plan should get you back to a stable state quickly while building toward a more robust system. If you share specific code snippets or logs from tests, I can refine this further.

