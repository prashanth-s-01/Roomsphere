# CS 520 Submission Checklist

Use this checklist to turn `docs/CS520-project-document-draft.md` into the final ODT/PDF submission.

## Step by Step

1. Open the official template file `520-ProjectDocument-Template-1 (1).odt`.
2. Copy the matching section text from `docs/CS520-project-document-draft.md` into the template.
3. Replace every `TODO` with real team information.
4. Add the cover-page items:
   - team member names
   - GitHub handles
   - team name
   - repo link
   - Google Drive link
5. Add screenshots for the UI section:
   - home page
   - signup/login
   - roommate finder
   - room vacancy posting
   - room vacancy detail
   - move-out sale page
   - post item page
   - messaging page
6. Add screenshots for implementation/project organization:
   - VS Code file tree or GitHub repo structure
   - pull request list or branch graph
   - commit history showing each team member
7. Add the architecture and data-model visuals:
   - export the Mermaid diagrams from the draft as images, or
   - recreate them in draw.io / Lucidchart / Figma and paste them into the template
8. Fill the work-plan and team-contribution table with real ownership.
9. Decide how you want to present testing:
   - honest current-state wording from the draft, or
   - improve the repo tooling first and then replace the draft text with real test results and coverage
10. Export the final document to PDF and check formatting before submission.

## What Still Needs Manual Input

- Exact team member list and handles
- Repo URL and Google Drive URL
- Screenshots and captions
- Work-plan dates
- Team responsibility mapping
- PR/commit screenshots for each contributor
- Any manual performance/usability observations you want to cite

## Repo Gaps Worth Mentioning in the Final Document

- Backend tests exist in `api/tests`, but the current Docker backend environment does not expose `pytest`.
- Frontend test files exist, but `web/package.json` currently has no `test` script.
- Frontend build currently fails because test-related dependencies/config are incomplete.

These are not reasons to hide the project. They are honest engineering findings and can be framed as limitations plus future work.
