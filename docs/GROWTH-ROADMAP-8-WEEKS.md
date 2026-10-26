# ProCounsel 8-Week SEO, AEO and Lead-Growth Roadmap

**Plan window:** 27 October–21 December 2026

**Primary objective:** Increase qualified education leads by using high-intent organic content and paid acquisition to feed ProCounsel's predictors, then convert predictor users into counselling bookings and enrolments.

**Primary markets:** Study Abroad, Study in India, MBA/CAT, NEET, JEE and MHT-CET.

**Operating model:** `Search/content → predictor or decision tool → CRM lead → counsellor follow-up → booking → qualified lead → enrolment`

This is the working plan. Update the checkboxes, owners, dates and results every week so the document remains useful rather than becoming a static strategy file.

## Current foundation

- [x] Manual AdSense component added to selected predictor, blog and long-form content pages.
- [x] Auto Ads kept off so ads do not appear indiscriminately across the main site, forms, checkout or dashboards.
- [x] Study Abroad AI College Predictor frontend completed.
- [x] GPT-backed study-abroad matching endpoint completed in `college-search-api`.
- [x] Predictor lead capture connected to the existing Study Abroad CRM endpoint.
- [x] Predictor SEO title, description, canonical, FAQ, breadcrumbs and SoftwareApplication schema added.
- [x] Predictor added to internal links, predictor hub, prerender routes and sitemap generation.
- [x] Desktop/mobile QA, targeted tests, TypeScript, lint, production build and full prerender crawl completed.
- [ ] Deploy the new API and website commits to production.
- [ ] Complete server-side Meta/CRM conversion feedback.

## Non-negotiable principles

1. **Tools are the conversion engine.** Country, course, exam and eligibility pages attract users; predictors and counselling convert them.
2. **Qualified leads matter more than raw form fills.** Optimise campaigns and content toward bookings, qualified leads and enrolments.
3. **Publish fewer, stronger pages.** Do not create hundreds of thin AI-generated pages. Every indexable page must answer a distinct search need.
4. **Education facts must be verifiable.** Fees, deadlines, eligibility, scholarships and visa information must cite official university or government sources and show a last-verified date.
5. **AEO is not a separate trick.** Use clear answers, strong entity signals, structured content, visible FAQs and primary-source evidence.
6. **Never promise admissions, scholarships, visas, jobs or rankings.** Predictors provide indicative shortlists, followed by human verification.
7. **Measure the entire funnel.** Traffic without predictor completion, qualified leads and enrolments is not success.

## Core KPI dashboard

Record the current baseline in Week 1. Review these numbers every Monday.

| Funnel stage | KPI | Eight-week direction |
|---|---|---|
| Search visibility | Non-brand impressions, top-20 keywords, indexed strategic pages | Consistent weekly growth |
| Search engagement | Organic CTR by query and landing page | Improve weak pages by at least 20% relative to baseline |
| Landing engagement | Engaged sessions, scroll depth, predictor CTA clicks | Improve weekly |
| Predictor funnel | Starts, completions, completion rate, errors | Reach and maintain at least 35% completion |
| Lead funnel | CRM leads, valid phone rate, qualified lead rate | Optimise quality, not only quantity |
| Sales funnel | Median first-response time, bookings, show rate | Contact new leads in under five minutes when the desk is open |
| Business outcome | Applications and enrolments by source | Attribute every outcome to source/campaign/page |
| Paid efficiency | Cost per lead, qualified lead and booking | Optimise to qualified lead and booking |
| Content quality | Indexing, backlinks, citations, assisted conversions | Improve monthly |

Never declare a channel successful from CPL alone. A cheap campaign that creates invalid or unqualified leads should be reduced or stopped.

## Analytics and CRM event contract

Use the same names and fields across GA4, GTM, Meta and the CRM.

| Event | Trigger | Required properties |
|---|---|---|
| `predictor_view` | Predictor page becomes visible | predictor, landing_page, source, campaign |
| `predictor_start` | User first interacts with the form | predictor, study_level/exam, country/state |
| `predictor_complete` | A valid report is generated | predictor, country, course, intake |
| `lead_submit` | CRM accepts the lead | lead_id, source, campaign, landing_page |
| `lead_qualified` | Counsellor marks lead qualified | lead_id, interest, country/course, lead_score |
| `counselling_booked` | Appointment is confirmed | lead_id, counsellor, booking_value |
| `application_started` | Student begins an application | lead_id, institution, program |
| `enrolment_confirmed` | Final enrolment is recorded | lead_id, institution, revenue/value |

Persist original and latest UTM values, landing page, referrer, device, predictor, country/course interest and consent timestamp in the CRM. Do not send sensitive academic or contact data to advertising platforms.

## Week 1 — Launch, tracking and conversion plumbing

**Goal:** Put the new predictor live safely and make every lead traceable.

- [ ] Deploy `college-search-api` first.
- [ ] Add production `OPENAI_API_KEY`; optionally set `OPENAI_STUDY_ABROAD_MODEL`.
- [ ] Confirm production allows `procounsel.co.in` and `www.procounsel.co.in`.
- [ ] Deploy the website after the API is healthy.
- [ ] Run one end-to-end production test on desktop and mobile.
- [ ] Confirm: report generated, CRM record created, consent stored, Meta browser event received and no contact details sent to OpenAI.
- [ ] Add the sitemap to Google Search Console and Bing Webmaster Tools.
- [ ] Request indexing for the predictor, Study Abroad hub and predictor hub.
- [ ] Configure the analytics event contract above in GA4/GTM.
- [ ] Create a Looker Studio or equivalent weekly funnel dashboard.
- [ ] Add CRM stages: New, Contacted, Qualified, Booked, Application Started, Enrolled, Lost and Invalid.
- [ ] Add lead-lost reasons so campaign quality can be diagnosed.
- [ ] Set counsellor ownership and a five-minute operating-hours response SLA.
- [ ] Connect Meta Conversions API or CRM/offline events for Qualified Lead, Booking and Enrolment.
- [ ] Deduplicate browser and server events using one event/lead ID.
- [ ] QA AdSense only on approved editorial and predictor pages.

**Week 1 exit criteria:** A test user can complete the predictor, appear once in CRM, receive a follow-up, and be traced from landing page through booking.

## Week 2 — Search strategy and information architecture

**Goal:** Build one keyword-to-page map and prevent duplicated or competing pages.

- [ ] Export the last 16 months of Google Search Console queries and pages.
- [ ] Group queries by Study Abroad, Study in India, MBA/CAT, NEET, JEE and MHT-CET.
- [ ] Label intent: information, comparison, eligibility, deadline, predictor or counselling.
- [ ] Assign exactly one primary URL to every priority keyword cluster.
- [ ] Identify pages with impressions but weak CTR; rewrite titles/descriptions first.
- [ ] Identify pages ranking positions 5–20; improve them before creating substitutes.
- [ ] Create the Study Abroad hierarchy:
  - `/study-abroad`
  - `/study-abroad/university-predictor`
  - `/study-abroad/<country>`
  - `/study-abroad/<country>/<course>` when enough unique content exists
- [ ] Create the Study in India hierarchy for courses, exams, states, cities and verified college pages.
- [ ] Define the partnered-college page template and disclosure requirements.
- [ ] Map internal links from every relevant blog to one commercial page and one tool.
- [ ] Check Core Web Vitals, mobile usability, canonicals, sitemap, robots and schema errors.
- [ ] Prepare the first 20-page editorial calendar with owner, reviewer, query, CTA and deadline.

**Week 2 exit criteria:** Every planned page has a unique intent, target query, destination URL, CTA, owner and reviewer.

## Week 3 — First Study Abroad authority cluster

**Goal:** Publish the first four country hubs and their highest-intent supporting pages.

Publish or materially upgrade:

- [ ] Study in the UK for Indian Students.
- [ ] Study in Canada for Indian Students.
- [ ] Study in Germany for Indian Students.
- [ ] Study in Australia for Indian Students.
- [ ] Cost of Studying in the UK vs Canada vs Germany vs Australia.
- [ ] September 2027 Intake: Timeline and Application Checklist.
- [ ] Universities Abroad for Students with 60%, 70%, 8 CGPA or Backlogs.
- [ ] IELTS 6.5 University Options and What Else Is Required.

Every country hub must cover eligibility, costs, intakes, English requirements, scholarships, application steps, visa overview, work considerations, universities/programs and a prominent predictor CTA. Link every supporting article back to its country hub and the predictor.

Distribution:

- [ ] Turn each hub into one email, one LinkedIn post, one carousel and two short videos.
- [ ] Answer real student questions collected from counsellors and CRM calls.
- [ ] Run one live webinar that sends attendees to the predictor.
- [ ] Retarget engaged page visitors who did not complete the predictor, subject to consent.

**Week 3 exit criteria:** Four complete country clusters are indexed, internally linked, source-verified and generating predictor starts.

## Week 4 — MBA/CAT seasonal demand capture

**Goal:** Capture MBA demand before and immediately after CAT activity peaks.

- [ ] Build or upgrade the MBA/CAT central landing page.
- [ ] Build a CAT percentile/college matching tool or a clearly scoped MVP.
- [ ] Publish CAT score vs percentile guidance with methodology and limitations.
- [ ] Publish MBA colleges by percentile bands, avoiding guaranteed-admission language.
- [ ] Publish IIM and non-IIM application timeline pages.
- [ ] Publish CAT result next-steps and interview-preparation pages.
- [ ] Build comparison pages for MBA fees, placements, location and specialisation using verifiable data.
- [ ] Add counselling CTAs after every decision point, not only at page end.
- [ ] Create Search and Meta campaign landing variants aligned with the exact ad promise.
- [ ] Track CAT/MBA leads separately in CRM and report qualified rate by campaign.
- [ ] Create a rapid-update checklist for result day, answer-key news and application deadlines.

**Week 4 exit criteria:** ProCounsel has a coherent MBA/CAT journey from search query to tool to counselling, with seasonal pages ready for fast updates.

## Week 5 — Expand Study Abroad and Study in India

**Goal:** Complete destination coverage and launch the first high-intent India cluster.

Study Abroad pages:

- [ ] Study in the USA for Indian Students.
- [ ] Study in Ireland for Indian Students.
- [ ] Study in New Zealand for Indian Students.
- [ ] Study in the UAE for Indian Students.
- [ ] MS in Computer Science country comparison.
- [ ] MBA Abroad without/with Work Experience.
- [ ] Scholarships for Indian Students: verified directory and deadlines.
- [ ] Study Abroad Budget Planner or cost-calculator specification.

Study in India pages:

- [ ] Study in India hub with pathways by course and exam.
- [ ] Verified engineering, medical and MBA college discovery journeys.
- [ ] State/city college pages only where unique data and useful comparisons exist.
- [ ] Exam-to-college pathways connecting NEET, JEE, MHT-CET and CAT tools.
- [ ] “How to choose a college” guide with placement, accreditation, cost and course checks.
- [ ] Partnered-college list with transparent partner/sponsored disclosure.

Partner college requirements:

- [ ] Verify official name, campus, programs, recognition/accreditation, fees and admissions contact.
- [ ] Link to primary sources and show last verified date.
- [ ] Label commercial relationships clearly.
- [ ] Never give partners unearned “best college” or ranking claims.
- [ ] Track page views, enquiries, qualified leads and applications per partner.

**Week 5 exit criteria:** All eight predictor destinations have strong hubs, and Study in India has a clear tool/content/lead architecture.

## Week 6 — AEO, trust and entity strengthening

**Goal:** Make priority pages easy for search engines, AI answers and students to understand and cite.

- [ ] Audit the top 30 commercial pages with the AEO template below.
- [ ] Put a direct 40–70 word answer below each primary question heading.
- [ ] Add useful comparison tables, ordered steps, definitions and decision criteria.
- [ ] Add visible FAQs based on Search Console and counsellor questions.
- [ ] Keep FAQ schema identical to visible page content.
- [ ] Add author, expert reviewer, last reviewed date and editorial policy.
- [ ] Cite official universities, exam bodies and government/immigration sources.
- [ ] Strengthen Organization, Person, Article, Breadcrumb and applicable tool schema.
- [ ] Make ProCounsel's services, location, counsellors and contact information consistent across the site.
- [ ] Create author/reviewer pages showing credentials and reviewed content.
- [ ] Remove unsupported superlatives, fake statistics and stale claims.
- [ ] Update pages where facts have changed; do not change dates without substantive review.

**Week 6 exit criteria:** The top 30 pages answer questions directly, demonstrate who created/reviewed them, and substantiate important claims.

## Week 7 — Authority, partnerships and distribution

**Goal:** Earn mentions and referral traffic rather than relying only on publishing volume.

- [ ] Publish three consented, verifiable student case studies with journey, decisions and outcome.
- [ ] Run two expert webinars with counsellors or partner institutions.
- [ ] Pitch useful data, tools or expert commentary to education publications and student communities.
- [ ] Ask genuine partner institutions and associations to link to relevant tools/resources.
- [ ] Create embeddable, branded checklists or calculators that link back to their source.
- [ ] Build an outreach list segmented by colleges, schools, coaching centres, communities and publications.
- [ ] Repurpose each major guide into YouTube, short video, carousel, email and counsellor script.
- [ ] Recover unlinked brand mentions and fix broken inbound links.
- [ ] Review backlink quality; reject paid/spammy link schemes.
- [ ] Compare assisted conversions from organic, referral, social and webinar channels.

**Week 7 exit criteria:** The site has new relevant referring domains, partner distribution and reusable proof-based student stories.

## Week 8 — CRO review and next-quarter scale plan

**Goal:** Double down on pages and campaigns that create qualified outcomes.

- [ ] Compare all eight weeks by landing page, predictor, country/course, source and campaign.
- [ ] Identify the pages with high impressions but low CTR.
- [ ] Identify pages with traffic but low predictor-start rate.
- [ ] Identify forms with high starts but low completion.
- [ ] Review AI endpoint errors, latency, cost and abuse patterns.
- [ ] Review lead validity, first-response time, qualification, bookings and enrolments.
- [ ] Run controlled CTA, form-length and proof-section experiments.
- [ ] Improve the top five near-ranking pages instead of immediately producing more pages.
- [ ] Refresh or consolidate pages that compete for the same query.
- [ ] Pause paid campaigns with poor qualified-lead economics.
- [ ] Increase budget only where qualified-lead and booking data supports it.
- [ ] Choose the next predictor/calculator based on proven demand:
  - Study Abroad cost calculator
  - Scholarship matcher
  - CAT/MBA college predictor
  - India course/college matcher
- [ ] Produce the next 90-day roadmap with owners and expected business impact.

**Week 8 exit criteria:** Leadership can see which query, page, tool and campaign produces qualified leads and enrolments, and investment decisions use that evidence.

## Priority content backlog

Work from the top down. Do not publish a later item merely because it is easier.

### Study Abroad

1. Study Abroad College Predictor
2. Study in UK for Indian Students
3. Study in Canada for Indian Students
4. Study in Germany for Indian Students
5. Study in Australia for Indian Students
6. Study in USA for Indian Students
7. Study in Ireland for Indian Students
8. Study in New Zealand for Indian Students
9. Study in UAE for Indian Students
10. September 2027 intake timeline
11. Universities for 60%/70%/8 CGPA profiles
12. Study abroad with backlogs
13. Universities accepting IELTS 6.5
14. MS in Computer Science country comparison
15. MBA abroad with and without work experience
16. Country cost comparison
17. Verified scholarship directory
18. Application document checklist
19. Visa interview and financial-document guide
20. Study Abroad cost calculator

### Study in India and exams

1. Study in India course and college hub
2. MBA/CAT central hub and predictor
3. CAT percentile vs college pages
4. MBA application deadlines
5. Engineering exam-to-college journey
6. Medical exam-to-college journey
7. State/city college comparisons with unique data
8. College selection checklist
9. Verified partnered-college directory
10. Admission counselling comparison and process pages

## Page-level SEO and AEO template

Every important page must have:

- One unique search intent and one canonical URL.
- A useful title written for clicks, not keyword stuffing.
- A specific meta description with the page's value and next action.
- One clear H1.
- A concise answer/summary immediately after the H1.
- A table of contents on long guides.
- Question-led H2s matching real user language.
- Short answers followed by evidence, explanation and examples.
- Comparison tables where a user must make a choice.
- Official-source citations beside time-sensitive claims.
- Author, expert reviewer and last-verified date.
- Original examples, data, tools or expert insight.
- Contextual links to its hub, related guides and the correct predictor.
- A relevant CTA near the top, mid-page and after the decision section.
- Breadcrumbs and only the structured data that matches visible content.
- Responsive layout, accessible labels, descriptive links and compressed media.
- No invented facts, fake rankings, guaranteed outcomes or copied content.

## Lead-conversion playbook

1. Match the landing page headline to the exact query or ad promise.
2. Explain the predictor outcome before requesting details.
3. Ask only fields required for matching and follow-up.
4. Show consent and explain how contact data will be used.
5. Save the CRM lead only once and deduplicate by phone/email plus event ID.
6. Show useful results immediately; do not make the experience feel like an empty lead gate.
7. Present the next best action: verify shortlist, book counselling or compare colleges.
8. Assign the lead automatically by country/course/exam.
9. Contact the lead within five minutes during operating hours.
10. Use personalised WhatsApp/email follow-up based on the user's selected path.
11. Record qualification, booking, application and enrolment outcomes.
12. Send consented server-side outcome signals back to ad platforms.

## Paid acquisition role

SEO compounds but is not instant. Use paid channels to create immediate predictor volume while organic pages mature.

- Google Search: bid on high-intent predictor, counselling, course and country queries.
- Meta prospecting: use student problems and useful tools, not vague brand creatives.
- Retargeting: target engaged visitors and predictor abandoners subject to consent.
- Exclusions: suppress converted/invalid audiences and irrelevant age/location segments.
- Landing pages: keep message, country/course and CTA consistent with each ad group.
- Optimisation: move from Lead to Qualified Lead/Booking events once CRM feedback is reliable.
- Budget rule: scale only when downstream qualification and booking economics are acceptable.

## Tool stack

### Required

- Google Search Console — queries, indexing, page performance and sitemap monitoring.
- GA4 and Google Tag Manager — behaviour and funnel measurement.
- Meta Ads Manager and Events Manager — campaigns, Pixel and Conversions API diagnostics.
- CRM — lead ownership, status, source, response time and revenue outcomes.
- Google Looker Studio — shared weekly funnel dashboard.
- PageSpeed Insights and Chrome Lighthouse — performance and Core Web Vitals checks.
- Bing Webmaster Tools — Bing/Copilot search visibility and crawl diagnostics.

### Useful when budget permits

- Ahrefs or Semrush — keyword gaps, backlinks and competitor research.
- Screaming Frog or Sitebulb — repeatable technical crawls.
- Microsoft Clarity — consent-aware heatmaps and recordings for conversion diagnosis.
- Google Trends — seasonality and regional demand.
- OpenAI — research organisation, briefs and structured drafting; never the sole source for facts.

## Weekly operating cadence

### Monday

- Review the KPI dashboard and CRM outcome quality.
- Check Search Console indexing and query movement.
- Select the week's three highest-impact improvements.
- Assign owners and deadlines.

### Tuesday–Thursday

- Research, create, review and publish.
- Update internal links and distribution assets.
- Run technical, analytics and conversion QA.

### Friday

- Review published work against the definition of done.
- Share traffic, predictor, lead, booking and enrolment results.
- Record experiments, lessons and next actions in this document or linked tickets.

## Definition of done

### New content page

- [ ] Target query and intent documented.
- [ ] Primary sources verified and linked.
- [ ] Author and reviewer assigned.
- [ ] SEO/AEO template completed.
- [ ] Predictor/counselling CTA included.
- [ ] Internal inbound and outbound links added.
- [ ] Mobile, accessibility and performance checked.
- [ ] Analytics events tested.
- [ ] Canonical, robots and structured data checked.
- [ ] Added to sitemap and requested for indexing when strategically important.

### New predictor or calculator

- [ ] User value is clear before form completion.
- [ ] Input validation and failure states tested.
- [ ] Results are useful and explicitly non-guaranteed.
- [ ] Contact details excluded from AI prompts.
- [ ] CRM deduplication and attribution tested.
- [ ] Browser/server conversion events deduplicated.
- [ ] Abuse controls, monitoring, latency and API cost reviewed.
- [ ] SEO content, FAQ, schema, canonical and internal links complete.
- [ ] Desktop/mobile and production end-to-end QA complete.

## Decisions still required

- [ ] Name the growth owner responsible for this roadmap.
- [ ] Name the technical, content, counsellor-operations and paid-media owners.
- [ ] Confirm the four first country hubs and editorial capacity per week.
- [ ] Decide whether CAT/MBA predictor or Study Abroad cost calculator is the next tool.
- [ ] Confirm Meta CAPI implementation route and CRM access.
- [ ] Set monthly paid budget and acceptable cost per qualified lead/booking.
- [ ] Define partner-college commercial disclosure language.

## First action when resuming this plan

Deploy and production-test the new Study Abroad predictor, then complete Week 1 tracking and Meta/CRM feedback before increasing traffic. Without reliable downstream outcome data, more traffic can create more leads while hiding whether they are useful.
