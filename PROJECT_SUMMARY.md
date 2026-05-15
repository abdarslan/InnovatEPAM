# InnovatEPAM Portal - Project Summary

## Overview
I've built an inovation portal. It allows idea submissions from employees and idea evaluations from admins.

## Phases Completed

### Phase 1: Core Portal
- [x] User registration with email/password
- [x] User login/logout
- [x] Role-based access (submitter/admin)
- [x] Idea submission form
- [x] Single file attachment
- [x] Idea listing page
- [x] Status tracking
- [x] Admin evaluation workflow

### Phase 2: Smart Submission Forms
- [x] Dynamic form fields by category
- [x] Category-specific guidance

### Phase 3: Multi-Media Support
- [x] Multiple file attachments
- [x] File preview capabilities

### Phase 4: Draft Management
- [x] Save ideas as drafts
- [x] Edit drafts before submission

### Phase 5: Multi-Stage Review
- [x] Configurable evaluation stages
- [x] Stage-specific actions

### Phase 6: Blind Review
- [x] Anonymous evaluation mode
- [x] Identity reveal after decision

### Phase 7: Scoring System
- [x] Multi-dimension scoring
- [x] Score aggregation and ranking

## Technical Decisions

### Technology Stack
- Framework: Next.js 15
- UI: React + Tailwind + shadcn
- Storage: SQLite
- Key Libraries: React Testing Library, Vitest, Playwright

### Key Architecture Decisions
- Comprehensive testing section in constitution.md.
- Iron session for session handling
- ADR section in constitution.md

## Challenges & Solutions

### Challenge 1: Not having many things to fill initial documentations like constitution.
I went through bootcamp modules and also actively discussed things and did brainstorming with gemini.

### Challenge 2: To create a new feature but decided to update a current spec i forgot that it switched to same feature branched that many commits behind. And afterwards there were tons of merge conflicts etc.
I carefully handled that specific situation via resolving them but afterwards i decided to delete the branches after merge to main.

## AI Collaboration

### Tools Used
- Github Copilot
- Github MCP
- Context7 MCP

### What Worked Well
Generally, SDD approach worked very good. Especially after few phases it felt very natural and under control. Also Github MCP worked very nicely for github prs and merges by ai. Context7 was good for critical tool selections.

### What Could Be Improved
- It requires ui polish. 
- Comprehensive stats for admin.
- Some gamification for users.
  
## Time Breakdown

| Phase | Actual |
|-------|--------|
| Setup & SpecKit | 20 mins |
| Phase 1: Core Portal | 2 hours |
| Phase 2: Smart Submission Forms | 30 mins |
| Phase 3: Multi-Media Support | 40 mins |
| Phase 4: Draft Management | 50 mins |
| Phase 5: Multi-Stage Review | 1.30 hours |
| Phase 6: Blind Review | 10 mins |
| Phase 7: Scoring System | 20 mins |
| Documentation | 30 mins |

## Reflection

### Key Learning
I learned how it is important to repeat this workflow to really develop a good sense of steps and decision makings.

### What I'd Do Differently
I would enforce more ui/ux decisions from begining. My plan was minimizing the effort to ui until end. But at the end i realized that i may not have time for ui overhaul and ui looks a bit too much like a skeleton.

### SDD vs Vibe Coding
First of all it completely changed how i feel about my role in this new dynamics. I finally felt a main player, things under my control. It feels like a orchestra conductor. Vibe coding was just a mess and complete lack of connection with what i had been building. 

### AI Collaboration Insight
Even though this approach and specifically speckit constructs very well optimized workflow ai can still have its problematic times. For example even though i had forbidden big monolithic commits it still time to time created a single commit out of a lot of tasks. On the other hand, i really got surprised by how scalable the approach is compare to my experience before.

---

*Submitted by: Abdurrahman Arslan*
*Date: 15/05/2026*
*A201 Cohort: [Cohort Name/Date]*