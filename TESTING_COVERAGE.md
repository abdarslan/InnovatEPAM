# Testing Coverage

Latest Vitest run:

- Tests: 278 passed, 0 failed
- Test files: 50 passed
- Coverage: 74.82% lines, 74.65% branches, 88.09% functions
  
File                        | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                                                                                                                                            
----------------------------|---------|----------|---------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------
All files                   |   74.91 |    74.65 |   88.09 |   74.82 |                                                                                                                                                              
 actions                    |   75.71 |    75.11 |   90.54 |   75.73 |                                                                                                                                                              
  auth.ts                   |    1.36 |        0 |       0 |    1.36 | 21-215                                                                                                                                                       
  idea-drafts.ts            |   86.41 |    80.76 |     100 |   89.18 | 111,150,155-156,208,278,318,346                                                                                                                              
  idea-field-rules.ts       |   85.41 |       76 |     100 |   83.72 | 56,98,110,130,194,203,218                                                                                                                                    
  ideas.ts                  |   86.18 |    81.91 |   94.54 |   87.28 | 158,183,206,241-287,311-313,339,345,420,433,535,667,713,723,758,791,809,818,834,860,932,950-953,964,968,979,983,1000,1005,1015,1072,1102,1117,1158,1173,1317 
 lib/auth                   |   52.38 |       50 |      70 |      50 |                                                                                                                                                              
  navigation-permissions.ts |     100 |      100 |     100 |     100 |                                                                                                                                                              
  password.ts               |     100 |      100 |     100 |     100 |                                                                                                                                                              
  session.ts                |    9.09 |    33.33 |       0 |    9.09 | 23-45                                                                                                                                                        
  validation.ts             |     100 |      100 |     100 |     100 |                                                                                                                                                              

| File | Lines | Branches | Funcs | Notes |
|---|---:|---:|---:|---|
| actions/auth.ts | 1.36% | 0% | 0% | Low because this file is a Next.js Server Actions module (`'use server'`), so Vitest does not execute it directly. The auth flows are covered by integration and E2E tests instead. |
| lib/auth/session.ts | 9.09% | 33.33% | 0% | Low because the current tests do not execute the runtime session helpers often enough; the file is mostly configuration plus Next.js/iron-session runtime wiring. |

The rest of the auth helper coverage is strong: lib/auth/password.ts and lib/auth/validation.ts are both at 100%.