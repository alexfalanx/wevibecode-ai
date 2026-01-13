Phase 7: Quick Edits & Direct Publishing Implementation PlanDate: January 12, 2026
Session Focus: Design and plan enhancements for seamless site editing, publishing, and multi-language support in WeVibeCode.ai, addressing potential pitfalls for a robust, failure-resistant product.Project Context & GoalsBuilding on the MVP (Phases 1-4) and the Export & Download feature (from deep-stirring-pinwheel.md), this phase introduces quick text/color edits and direct publishing to enable users to generate, tweak, and launch basic sites (with optional simple app-like features) in a "few clicks" workflow. The emphasis is on creating a clean, seamless experience that minimizes failures, exploits multi-language strengths (focusing on Italian and Polish initially, with scalability to Spanish, German, etc.), and alleviates/eliminates identified cons.Core Objectives:Allow basic modifications (text, colors) without breaking AI-generated code.
Enable direct publishing to subdomains or custom domains, with fallbacks to exports.
Ensure robustness: Prevent failures through error handling, caps, monitoring, and user guides.
Leverage multi-language support: Make edits, prompts, and published sites work flawlessly in IT/PL (using existing next-intl setup), with hooks for expansion.
Avoid competition overlap: Position as a "prompt-to-live starter" tool, not a full CMS—focus on simplicity and speed.

Key Advantage Exploitation: Multi-language is a differentiator. Use AI (GPT-4o) for auto-translations during edits/prompts, persist user language prefs, and generate localized sites. This makes the tool appealing for non-English markets (e.g., Polish small businesses, Italian restaurants), where quick, localized sites are underserved.Addressing Cons: Suggestions & MitigationsTo create a failure-resistant product, we've systematically tackled the cons from prior brainstorming. Each suggestion eliminates or alleviates risks while keeping implementation lightweight.User Flow & Speed ConsCon: Too basic edits might not suffice for users needing more.
Mitigation: Make edits AI-assisted—e.g., user changes text, AI validates/patches HTML to prevent breaks (via quick GPT-4o-mini call). Add "smart suggestions" (e.g., "Rephrase in Italian?") tied to user language. Limit to text/colors for MVP, with prompts for deeper changes (e.g., "Add calculator" regenerates patched version). This keeps it seamless without overcomplicating.
Con: Custom domains could confuse beginners.
Mitigation: In-app wizard with step-by-step guides (translated via next-intl), auto-verification, and video embeds. Fallback: One-click subdomain publish (e.g., [slug].wevibecode.ai) as default. Error-proof with timeouts/retries and clear messages (e.g., "DNS not ready yet—try again in 5 min").

Technical Fit ConsCon: Hosting load and potential abuse.
Mitigation: Implement soft caps (e.g., 5 active sites/free user, tied to credits). Use Vercel analytics for monitoring—auto-suspend high-load sites with notifications. Offload to user-managed deploys (via exports) for heavy use. Cache public previews aggressively to reduce compute.
Con: Edits could break AI-generated code.
Mitigation: Use safe patching: Parse HTML with DOM tools (no deps needed), apply changes via CSS vars for colors and string replacements for text. Post-edit, run a quick validation (e.g., check for syntax errors via browser eval in sandbox). If broken, rollback with undo button and suggest regeneration.
Con: App expansions add complexity.
Mitigation: Scope to web-only for MVP (e.g., JS-based features like calculators). Defer mobile apps to future phases. Ensure prompts specify "web app" mode, with AI enforcing simplicity (e.g., no external APIs in basics).

Business & Differentiation ConsCon: Hosting liability (e.g., spam content).
Mitigation: Add terms/disclaimers on publish (e.g., "You own content; we may suspend violations"). Moderate via reports and AI scans (GPT-4o for flagged sites). RLS in Supabase ensures isolation.
Con: Potential overlap with big players.
Mitigation: Differentiate via AI prompts for expansions (e.g., "Add Polish booking form")—keep it prompt-driven, not drag-and-drop. Market as "AI bootstrapper" for quick launches, with easy exports for migration.
Con: Scaling costs.
Mitigation: Optimize with Vercel edge caching and Supabase query limits. Tiered pricing: Free subdomains basic; premium for custom domains/unlimited sites. Monitor metrics to predict costs.

Overall Robustness Enhancements:Error Handling: Global try/catch in APIs, user-friendly toasts (extend existing system), and fallbacks (e.g., if publish fails, auto-export ZIP).
Multi-Language Integration: All new UIs/modals use next-intl for translations (add to common.json). AI prompts include language context (e.g., "Generate in Italian"). Edits preserve locale—e.g., text changes auto-detect/suggest translations. Test rigorously in IT/PL; design hooks (e.g., locale params) for ES/DE additions.
Testing Focus: Emphasize failure scenarios (e.g., bad DNS, edit breaks) in plan below.
Scalability Eye: Design for expansion—e.g., abstract language handling for easy additions.

These mitigations ensure a seamless, low-failure product while amplifying the multi-language edge.Key Architecture DecisionsEditing Mechanism: Client-side patching with AI validation. Text: String replacement via selectors. Colors: CSS variable updates. Multi-lang: Auto-translate edits if user pref ≠ site lang.
Publishing Strategy: Subdomain via Vercel (dynamic routes). Custom domains: CNAME verification proxy. Public serving: Extend /api/preview to public mode, with caching.
Multi-Language Handling: Build on existing next-intl (5 langs). New features: Language-aware prompts/edits (e.g., GPT call: "Translate edit to Polish"). Persistence: Use profiles.preferred_language for defaults.
Robustness Layer: Add validation endpoints (e.g., /api/validate-edit). Caps via Supabase triggers. Monitoring: Integrate Vercel logs with credits_log for abuse detection.
App Scope: Web-only; expansions via prompt regeneration (patch into existing HTML).
Fallbacks: If anything fails (e.g., domain verify), revert to export modal.

Technical DetailsDependencies to Installreact-color@2.19.3 (for color pickers—lightweight, client-side).
dompurify@3.1.7 (sanitize user inputs to prevent XSS).
No heavy deps; leverage existing (Next.js, Supabase, OpenAI).

New Files to Create (7 files)

components/SiteEditor.tsx                 # Edit UI (text forms, color pickers)
components/PublishModal.tsx               # Publish options (subdomain/custom)
app/api/publish-site/route.ts             # Handle publish, slug gen, is_published update
app/api/public-preview/[slug]/route.ts    # Serve public sites (extend preview API)
app/api/verify-domain/route.ts            # DNS check for custom domains
app/api/validate-edit/route.ts            # AI validation for edits
lib/publish.ts                            # Utilities (slug gen, patching)
types/publish.ts                          # TS interfaces (e.g., PublishOptions)

Files to Modify (4 files)

components/Preview.tsx                    # Add edit/publish buttons
app/dashboard/preview/[id]/page.tsx       # Integrate editor modal
database schema (via Supabase dashboard)  # Add to previews: slug (VARCHAR), custom_domain (VARCHAR), published_url (VARCHAR)
public/locales/{it,pl}/common.json        # Add translations for new UI (e.g., "Publish Now", "Edit Text")

Database ChangesAdd columns to previews: slug, custom_domain, published_url.
Update RLS: Allow public SELECT for is_published=true (with user_id check for edits).

Implementation Plan SummaryWeek 1: Editing Features (Days 1-6)Days 1-3: Text Editing  Parse preview HTML for editable elements.  
UI: Click-to-edit forms in SiteEditor.tsx (sanitize inputs).  
Save: Patch HTML, update Supabase via API.  
Multi-lang: If edit lang ≠ site lang, auto-GPT translate.

Days 4-6: Color Editing & Validation  Extract CSS vars for palette.  
Color picker UI; patch CSS.  
/api/validate-edit: GPT-4o-mini checks for breaks, suggests fixes.

Week 2: Publishing & Robustness (Days 7-14)Days 7-9: Subdomain Publishing  /api/publish-site: Gen unique slug, set is_published, return URL.  
Serve via /api/public-preview/[slug].  
Modal: Simple "Publish to [slug].wevibecode.ai" button.

Days 10-12: Custom Domains & Guides  /api/verify-domain: Fetch DNS, confirm CNAME.  
Wizard in modal: Translated steps, progress indicators.  
Fallback: If verify fails, offer export.

Days 13-14: Polish, Multi-Lang, & Mitigations  Add caps (query profiles.credits_remaining).  
Translations: Update JSON for IT/PL; test prompts/edits.  
Error handling: Toasts for failures, auto-rollback.

Testing & VerificationManual Testing ChecklistEdit text/colors: Verify no breaks, multi-lang translations work (IT/PL).
Publish subdomain: Load [slug].wevibecode.ai, check caching.
Custom domain: Simulate DNS, verify success/fail paths.
Failures: Test edit breaks (rollback), high load (caps trigger), invalid inputs (sanitize).

Edge CasesMulti-lang mismatches: Edit English site in Polish UI—auto-translate.
Abuse: Exceed caps—graceful denial with upgrade prompt.
Network issues: Retries for DNS verify; offline fallbacks to exports.
App features: Add JS calculator via prompt—edit/publish without issues.

PerformanceEdit/save <5s; publish <10s.
Multi-lang overhead: Cache translations.

Deployment ChecklistSet Vercel env for domain verification (e.g., DNS API if needed).
Test in IT/PL locales.
Monitor first week: Publishes, errors, lang usage.

Success MetricsPublish rate >60% of previews.
Edit usage in IT/PL >30% of sessions.
Failure rate <5% (tracked via logs).

Next Steps (Future Enhancements)Phase 8: App Expansions (e.g., React Native exports).
Language additions: ES/DE via next-intl updates.
Premium: Unlimited publishes, advanced edits.

## Direction Shift Summary
This phase builds directly on the Export & Download features (Phase from deep-stirring-pinwheel.md) but pivots toward a more integrated "prompt-to-live" experience: Users generate, make quick edits (text/colors), and publish directly (subdomain or custom domain) with minimal clicks. The key change is emphasizing in-app hosting and edits over external exports as the primary path, with exports as fallbacks. Prioritize robustness (e.g., failure mitigations) to ensure seamless UX, and exploit multi-language advantages: Focus implementation and testing on Italian (IT) and Polish (PL) first, using next-intl for all new UIs and GPT for localized edits/prompts. This differentiates us in non-English markets. Expand to Spanish (ES) and German (DE) via hooks, but defer until post-MVP.