# Quickstart: Anonymous Idea Evaluation with Scoring System

## Overview

This guide walks admins and users through the new anonymous evaluation and scoring workflow.

## For Admins: Evaluating Ideas with Ratings

### Stage 1: Spam Check (No Rating Required)

1. Open **Admin Dashboard** → **Ideas** → Filter by **Stage 1**
2. Select an idea to view details
3. You will see **submitter name and profile** (not anonymous at stage 1)
4. Review content for spam/inappropriate language
5. Click **Approve to Stage 2** or **Reject**
   - No rating is required or expected at this stage
   - Rejection ends the idea workflow immediately

### Stage 2: Strategic Alignment (Rate 1-5)

1. Open **Admin Dashboard** → **Stage 2 Queue** (assigned ideas)
2. Click an idea title to open detail view
3. Notice: **Submitter name/email is NOT visible** (Anonymous)
4. Review the idea description and comments
5. Under **Evaluation Panel**, find **"Alignment Rating"** section
   - **Question**: How well does this idea align with our department's strategic goals?
   - **5-star rating** or numeric input (1 = Poor alignment, 5 = Perfect alignment)
6. Select your rating (e.g., click ⭐⭐⭐⭐ for "4/5")
7. (Optional) Leave a comment explaining your reasoning
8. Click **Approve to Stage 3** or **Reject**
   - **Validation**: System requires a rating before you can proceed
   - If you forget to rate: You'll see "Please rate before advancing"

### Stage 3: Feasibility Review (Rate 1-5)

1. Open **Admin Dashboard** → **Stage 3 Queue** (assigned ideas)
2. Click an idea to open
3. Submitter is still **Anonymous**
4. Review all previous comments and approval history (including **Stage 2 Alignment Rating: 4/5**)
5. Under **Evaluation Panel**, find **"Feasibility Rating"** section
   - **Question**: How realistic and implementable is this idea?
   - (1 = Not feasible, 5 = Highly feasible)
6. Select your rating
7. (Optional) Leave a comment (e.g., "Good technical fit but requires 2 engineers")
8. Click **Approve to Stage 4** or **Reject**

### Stage 4: Business Impact (Rate 1-5)

1. Open **Admin Dashboard** → **Stage 4 Queue** (assigned ideas)
2. Click an idea
3. Submitter is still **Anonymous**
4. Review timeline showing:
   - Stage 1 approval (no rating)
   - Stage 2: Alignment: 4/5
   - Stage 3: Feasibility: 3/5
   - Comments and reasoning
5. Under **Evaluation Panel**, find **"Impact Rating"** section
   - **Question**: What is the potential business/organizational value of this idea?
   - (1 = Minimal impact, 5 = Transformational impact)
6. Select your rating
7. (Optional) Leave final recommendations/comments
8. Click **Approve & Complete** or **Reject**
   - **Validation**: Rating is required
   - If **Approved**: Idea status changes to **"Completed"**; submitter identity is now revealed to implementation team
   - If **Rejected**: Idea is archived; **submitter identity remains anonymous and is never revealed**

### Timeline View (All Stages)

1. From any idea detail page, scroll to **"Evaluation Timeline"** section
2. See all stage progressions with timestamps:
   ```
   Stage 1: Approved by Admin1 on May 15 — No rating
   Stage 2: Approved by Admin2 on May 15 — Alignment: 4/5
   Stage 3: Approved by Admin3 on May 15 — Feasibility: 3/5
   Stage 4: Approved by Admin4 on May 15 — Impact: 4/5
   ```
3. Admin names are visible (for accountability)
4. **Submitter name is never visible during stages 2-4** (anonymous evaluation)

---

## For Users: Viewing Your Evaluated Ideas

### View a Completed Idea with Scores

1. Navigate to **Dashboard** → **My Ideas** → Filter by **"Completed"**
2. Find your idea in the list
3. Idea card shows:
   - Title, description summary
   - Status: **Completed**
   - **Ratings**: Alignment: 4/5 | Feasibility: 3/5 | Impact: 4/5
4. Click the idea card to open full details
5. On detail page, see:
   - All three evaluation scores prominently displayed
   - Full timeline showing each stage approval with scores
   - Comments from each evaluator
   - If approved: Next steps / contact info for implementation team

### Understand Your Scores

| Rating | Meaning | Next Steps |
|--------|---------|-----------|
| **Alignment: 4/5** | Your idea aligns well with department strategy | Strong strategic fit |
| **Feasibility: 3/5** | Moderate technical difficulty; doable but requires planning | Implementation may need resource discussion |
| **Impact: 4/5** | High potential value to the organization | Strong business case; prioritized for implementation |

### What If My Idea Was Rejected?

1. Ideas rejected at **any stage** are marked as **"Rejected"**
2. You will **not** see the evaluation scores (only rejection status)
3. **Submitter identity remains anonymous** — evaluators cannot be individually identified
4. You can **submit a revised idea** as a new submission and restart at Stage 1

---

## For Implementation Team: Approved Ideas

1. Open **Dashboard** → **Approved Ideas** (or **Implementation Queue**)
2. Idea card now shows **submitter name and contact information** (unmasked)
3. Full rating scores displayed: Alignment: 4/5 | Feasibility: 3/5 | Impact: 4/5
4. Timeline shows all evaluation feedback for context
5. Contact submitter to discuss implementation details, budget, timeline
6. Document implementation plan in the idea's implementation section

---

## Key Principles

### Anonymity During Evaluation

- **Stages 1-4 (during evaluation)**: Admins cannot see who submitted the idea
- **Reason**: Ensures unbiased, fair evaluation based on idea merit, not submitter's status/reputation
- **How it works**: Submitter field is hidden in the UI; only idea content, description, and previous comments are visible

### Ratings Are Permanent

- Once you submit a rating, **you cannot change it**
- **Reason**: Maintains audit trail integrity for compliance and transparency
- **If you made an error**: Leave a follow-up comment explaining; rating remains locked
- **All ratings are timestamped** and attributed to you for accountability

### One Admin Per Stage

- Each stage has **exactly one assigned admin**
- **No multi-admin voting** or consensus required
- Each admin's rating is their professional judgment
- **Progression**: Idea advances when admin approves + submits rating

### Rejection Is Final

- If an idea is **rejected at any stage**, it ends immediately
- **No revision or re-submission** of the same idea
- User can **submit a new, improved idea** as a fresh proposal
- Rejected ideas **remain anonymous** (submitter never learns who evaluated it)

---

## Examples

### Example 1: Complete Approval Flow

**Day 1, Admin1 (Stage 1)**:
- Reviews "Mobile app for expense tracking"
- Not spam ✓
- Approves → Stage 2
- Timeline: "Stage 1 Approved (no rating)"

**Day 2, Admin2 (Stage 2)**:
- Reviews anonymously (doesn't see submitter "John Doe")
- Reads description: "Mobile app for expense tracking"
- Rates alignment: **⭐⭐⭐⭐ (4/5)** — "Good fit for mobile-first strategy"
- Approves → Stage 3
- Timeline shows: "Stage 2 Approved — Alignment: 4/5"

**Day 3, Admin3 (Stage 3)**:
- Reviews anonymously
- Sees Stage 2 rating (4/5)
- Rates feasibility: **⭐⭐⭐ (3/5)** — "Doable with 2 engineers"
- Approves → Stage 4
- Timeline shows: "Stage 3 Approved — Feasibility: 3/5"

**Day 4, Admin4 (Stage 4)**:
- Reviews anonymously
- Sees all prior ratings and feedback
- Rates impact: **⭐⭐⭐⭐⭐ (5/5)** — "High ROI, frequent expense pain point"
- Approves & Completes
- Timeline shows: "Stage 4 Approved — Impact: 5/5"
- Submitter name (John Doe) now visible to implementation team

**John's View**:
- John sees completed idea with all three scores: Alignment: 4/5 | Feasibility: 3/5 | Impact: 5/5
- John never learns who evaluated it (admins were anonymous during stages 2-4)
- Implementation team contacts John on Day 5 with next steps

### Example 2: Early Rejection

**Day 1, Admin1 (Stage 1)**:
- Reviews "Market manipulation scheme"
- Flagged as spam/inappropriate ✗
- Rejects
- Idea marked "Rejected"
- Status: Complete

**Submitter's View**:
- Sees idea status: "Rejected"
- No scores displayed
- No feedback provided (stage 1 is gate-level only)
- Can submit a new idea for next review cycle

---

## FAQ

**Q: Why can't I see who submitted an idea during evaluation?**
A: Anonymity ensures fair evaluation. Admins rate ideas on merit, not submitter reputation or relationships.

**Q: What if I think a rating was unfair?**
A: You can contact your department manager with your concern. Ratings are logged with evaluator identity and timestamp for review.

**Q: Can I appeal a rejection?**
A: No, but you can submit an improved idea for a new evaluation cycle.

**Q: Why are my scores lower than I expected?**
A: Review the comments from each stage—they provide reasoning. Focus on the feedback and improve next submission.

**Q: When can I start implementing my approved idea?**
A: Implementation team will contact you within 2 business days of approval completion. Timelines depend on resource availability.

**Q: Can rejected idea scores be shared with me?**
A: No, rejected ideas are not scored. Stage 1 is a gate; only spam/appropriate filter, not a merit evaluation.
