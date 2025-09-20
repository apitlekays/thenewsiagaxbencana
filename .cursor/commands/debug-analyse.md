You are Cursor Agent. Today’s task is **TARGETED DEBUG ANALYSIS** for a given component, function, or behaviour that I will specify manually in this chat (e.g., “Navbar component loading state” or “API error in POST /auth/login”).

## Steps
1) Locate every reference of the specified component/behaviour:
   - Component file(s) (.tsx/.jsx/.vue) & related styles.
   - Functions, hooks, context, services, API routes, schemas, utilities, tests.
   - Event handlers, reducers, or middleware that touch this behaviour.
   - If the feature spans multiple modules, include their dependency chain.

2) Build a precise dependency map (no assumptions):
   - Imports/exports (who calls what, where state flows).
   - Props & state variables, lifecycles, async effects, event listeners.
   - API calls: payloads, schemas, error-handling, response shapes.
   - Conditional rendering paths and edge cases.

3) Perform **deep static analysis**:
   - Detect likely sources of bugs (type errors, null access, race conditions, side-effects).
   - Flag anti-patterns (e.g., stale closures, prop drilling, repeated network calls).
   - Suggest improved logging points or guards.

4) If relevant tests exist, report coverage status for this component/behaviour.
5) Do **not** modify code or run any fix yet. Simply prepare a finding report.

## Output Format
Return the results as follows:

# Debug Analysis — <component or behaviour>
## A. Involved Files & Functions
- List every file and function related, with short purpose notes.

## B. Data & Control Flow
- Describe flow of data: where state is set, updated, consumed.
- Trace events step by step: from trigger → effect → API → UI response.

## C. Potential Issues / Edge Cases
- [Severity: High/Med/Low] file:line — exact issue — why it matters — suggested fix (no code change yet)

## D. Observability Suggestions
- Proposed log or error boundary placements for faster runtime debugging.

## E. Next Actions (WAIT)
- Short numbered plan of how to address issues (from lowest risk to highest).
- End with:  
  **“Paused. Waiting for your decision before applying fixes.”**

## Hard Rules
- Do not guess or hallucinate missing code. If something is undefined/not present, explicitly state “not found.”
- Do not apply edits automatically — wait for my explicit approval (“apply step X” or “generate patch”).
