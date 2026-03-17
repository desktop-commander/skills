---
name: bvp-investment-memo
description: This skill produces a BVP-style investment recommendation memorandum for any startup. Use this skill when asked to write, draft, analyze, or create an investment memo, VC memo, partnership memo, or investment recommendation. Modeled directly on 19 real Bessemer Venture Partners memos: Shopify, Twilio, Pinterest, Twitch, Auth0, Wix, Yelp, Dropcam, Rocket Lab, Fiverr, PagerDuty, SendGrid, Velo3D, LinkedIn, LifeLock, Mindbody, Toast, ServiceTitan, and Medi Assist.
version: 1.1.0
---

# BVP Investment Memo

Produce a rigorous, BVP-style investment memorandum for any startup, modeled on 19 real Bessemer memos. The output should read like an internal VC document written for a partnership meeting — not a pitch deck, not a summary, but a confident analytical recommendation.

## References

- [Section Guide](references/section-guide.md) — Every section, what to include, and how BVP writes each one
- [Memo Patterns](references/memo-patterns.md) — Voice, tone, recurring analytical frameworks, and BVP's signature moves
- [Stage Templates](references/stage-templates.md) — Structure differences between seed, Series A, and Series B+ memos
- [Research Guide](references/research-guide.md) — How to research a company via web search when data is missing

## Workflow

### Step 0: Intake — accept any inputs the user provides

Accept any combination of:
- Raw text description of the company
- Pitch deck (uploaded PDF or file path)
- Website URL
- Crunchbase/LinkedIn URL
- Raw notes or bullet points
- "Just the company name" — that is enough to start

Do NOT ask the user for all information upfront. Proceed immediately to Step 1.

### Step 1: Extract what is known

From whatever inputs exist, extract:
- Company name + description
- Round stage (if mentioned)
- Investment terms (if mentioned)
- Any metrics shared (MRR, ARR, customers, growth, churn, CAC, margins, burn)
- Founder names and backgrounds
- Product description
- Competitors mentioned

### Step 2: Research gaps via web search

For any missing information, search the web before asking the user. Run searches in parallel where possible.

Priority research order:
1. Company website + product pages
2. Crunchbase profile (funding history, team, investors)
3. LinkedIn (founder backgrounds, team size)
4. Recent news and press coverage (TechCrunch, Business Insider, sector press)
5. App stores, GitHub, ProductHunt (product validation, user reviews)
6. Competitor landscape (search "[company] competitors", "[company] vs [known competitor]")
7. Market size (search "[industry] market size TAM", "[industry] Gartner/Forrester")

See [Research Guide](references/research-guide.md) for specific search patterns and what to look for.

### Step 3: Ask the user only for what cannot be found

After exhausting web research, identify what is still missing. Ask in a single, consolidated message — never ask piecemeal across multiple turns.

Always ask for (if not found anywhere):
- Key financial metrics (MRR/ARR, growth rate, burn) — these are almost never public
- Deal terms (check size, valuation, ownership %) — almost never public at early stage
- Internal context (why BVP specifically, fund fit, relationship to company)

Optionally ask for:
- Pitch deck (say: "If you have a pitch deck, sharing it will significantly improve the memo")
- Any customer references or diligence notes the user has

Format the ask as a clean numbered list. Do not ask for things findable on the web.

### Step 4: Select structure by stage

- **Seed** (Dropcam, early Twilio, Wix): Light financials, heavy product intuition and founder bet. 3-5 pages.
- **Series A** (Shopify, Pinterest, Auth0, Fiverr, Yelp): Full structure, early traction, clear thesis. 5-8 pages.
- **Series B+** (PagerDuty, LinkedIn, SendGrid, ServiceTitan): Full SaaS metrics pack, scenario analysis, detailed financials. 8-12 pages.

See [Stage Templates](references/stage-templates.md) for section-level structure per stage.

### Step 5: Write the memo

Follow the section order in [Section Guide](references/section-guide.md). Apply core writing rules:

1. Open with the investment ask in the first sentence: amount, round, valuation, ownership
2. Every product claim needs a concrete example: customer story, use case, or demo anecdote
3. Every market claim needs a dollar figure: attach a number and a source or proxy
4. Mark any gaps clearly inline: [SOURCE NEEDED], [METRIC NEEDED], [CONFIRM WITH COMPANY]
5. Risks section must be genuine: name the real threats, not platitudes
6. Conclusion is one paragraph: recommendation + top 2-3 reasons + biggest open question

Apply tone and analytical patterns from [Memo Patterns](references/memo-patterns.md).

### Step 6: Quality check

Before delivering, verify:
- First sentence states dollar amount, round stage, valuation, and ownership % (or marks them [TBD])
- At least 5 hard metrics with numbers, or [METRIC NEEDED] markers showing awareness of gaps
- Competition section names specific competitors with context
- Risks section has 3+ genuine risks with explanation
- Team section reads the CEO and explicitly names key missing hires
- Scenario or outcomes table present (Series A+)
- Conclusion makes a clear, direct recommendation
- Tone is confident first-person plural throughout, no hedging
- Sources cited inline where data came from web research
