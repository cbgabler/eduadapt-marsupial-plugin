# Contributing Guide
How to set up, code, test, review, and release so contributions meet our Definition
of Done.

## Code of Conduct

### Our Pledge
We are committed to providing a welcoming and accessible experience for everyone regardless of background or identity.

### Our Standards
We expect all contributors and participants to:
* Be respectful of different viewpoints and experiences.
* Use welcoming and inclusive language.
* Accept constructive criticism.
* Show empathy and kindness to others.

Examples of unacceptable behavior include:
* Harassment, trolling, and/or personal attacks.
* Any other conduct that could be considered unprofessional or unwelcome.

### Enforcement
Instances of unacceptable behavior may be reported by contacting any member of the project team (emails can be found in the README).

The project team has the right and responsibility to remove, edit, or reject comments, commits, and other contributions that do not align with this Code of Conduct.

##Getting Started

### 1. Setup Environment 
```bash
git clone https://github.com/cbgabler/ehr-module-simulator.git
cd <your-repo-name>
```
### 2. Install Dependencies
```bash
cd frontend
npm install

cd ../electron
npm install
```
### 3.  Building Locally
```bash
cd frontend
npm run dev

cd ../electron
npm start
```

## Branching & Workflow
This project follows a structured branching strategy to ensure efficient collaboration and workflow:

### Branch Types
1. **`main`**: Long-running branch for production-ready code.  
2. **`feat/[topic-name]`**: Feature-specific branches created from `main`. Use for implementing features or fixes.  
3. **`feat/[topic-name]-topic/[subtopic-name]`**: Sub-branches for collaboration on feature parts. Created from `feat/[topic-name]`.  

### Workflow
Follow these steps for new development:
1. **Sync with `main`**: Make sure you local `main` branch is up-to-date before starting any new work.
	```bash
	git checkout main
	git pull origin main
	```
2. **Create your branch**: Create your new branch from the `main` branch.
	```bash
	git checkout -b feat/[topic-name]
	```
3. **Make changes**: Make necessary changes and commit them with clear and descriptive commit messages.
4. **Push your branch**: Upload your branch to the remote repository
	```bash
	git push -u origin feat/[topic-name]
	```
5. **Open a Pull Request**: Go to the repository’s GitHub page and open a new Pull Request to merge your branch into `main`.
6. **Review**: Your PR must be reviewed and approved by at least one other team member.
7. **Merge**: Once approved, your branch will be merged into `main`.

### Rebase vs. Merge Policy

A combination of `rebase` and `merge` will be used to keep the `main` branch history clean.

#### **When to Rebase**

* **Purpose**: To update your feature branch with the latest changes from `main`.
* **When**: Do this before submitting a PR, or if a PR has become outdated while in review.
	```bash
	git pull --rebase origin main
* Conflicts will have to be resolved, then the updated branch can be force-pushed.
	```bash
	git push --force-with-lease origin feat/[topic-name]

#### **When to Merge (Squash and Merge)**

* **Purpose**: To integrate a completed feature branch into the `main` branch
* **When**: Happens **only** after a PR for a feature branch is approved.
* **Method**: The **”Squash and Merge”** option will be used on PRs to keep the `main` history clean.

## Issues & Planning
Explain how to file issues, required templates/labels, estimation, and
triage/assignment practices.

When opening a new issue, go to the Issues tab and click “New Issue”, then choose the appropriate template for the issue at hand. The template will talk you through including all the relevant details needed. Please use clear, relevant and descriptive titles so we can fully understand everything.

For an estimation we will receive and talk through issues within 1-3 business days as a team, if it is a larger problem then we will reach out and communicate how long we think it will take to solve.

Triage and assignment practices reoccur when we do spring planning and coordination every other week.

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format for clarity:
- `fix:` Minor fixes or tweaks.
- `feat:` New features or enhancements.
- `chore:` Routine updates (e.g., dependency upgrades).
- `config:` Configuration changes.
- `merge:` Merge activity.

**Examples:**


## Code Style, Linting & Formatting
This project uses the default ESLint and Prettier to keep the code consistent and easy to read. It is located in the frontend/eslint.config.js file. More descriptive linting/formatting will be introduced at a later time.

The commands for checking this project locally are:
Check for linting issues
npx eslint .

Automatically fix fixable problems
npx eslint . --fix

Check formatting with Prettier
npx prettier --check .

Auto-format all files
npx prettier --write .


## Testing
Define required test types, how to run tests, expected coverage thresholds, and
when new/updated tests are mandatory. We will refine a testing plan in the future.

## Pull Requests & Reviews

Requirements:
- 1-2 Reviewers (not the author)
- PR template must be filled out (summary, linked issue, test evidence)
- Must pass: Lint checks, all tests, CI build
Size and Quality
- Keep PRs under ~400 lines if possible.
- Use draft PRs for early feedback
- Use squash merge where approved


## CI/CD

**Mandatory Jobs:**  
[deploy-electron.yml](https://github.com/cbgabler/ehr-module-simulator/blob/main/.github/workflows/deploy-electron.yml) is a required job to pass before merge/release. To view each log, click on the dropdown and you can view the run information for each step.

## Security & Secrets
- Do not hard-code credentials, tokens, or paths.
- Security issues should be reported privately via email to the team lead and instructor.
- Dependencies will be updated every sprint to minimize vulnerabilities (npm audit fix).

## Documentation Expectations
Update relevant documentation for any code or UI change:
- README.md
- docs/ folder
- Inline docstrings
- Changelog entries if feature-level
PRs missing documentation updates may be delayed in review.

## Release Process

For versioning we will use MAJOR.MINOR.PATCH[-PRERELEASE][+build]
EX: v1.0.0 for initial stable release
v1.1.0 for adding features
v1.1.1 for fixing bugs
v1.1.1-beta.2 for for beta testing
v2.0.0 for breaking changes

We will tag the release commits according to the versioning schema
This is typically automated within github to work as described above.

For changelog generation, we will maintain a CHANGELOG.md that will track all of the changes (commits and merges to main branch) made to the project.

This will be done by parsing the commit messages by Release Please, which is a github action that is built to automatically handle this entire process for us!

Packaging/Publishing steps
The electron app is built and packaged using electron-builder. The React frontend is compiled into static files and the electron main process is bundled with those files.

Github actions automatically builds these installers for all platforms when a release tag (like v.1.3.0) is created, the binaries are then attached to the corresponding GitHub Release.

Rollback Process
If a release introduces a serious bug we need to unmark the release in github (set it as pre-release in the Releases page), then mark the last known good version’s release to “Latest”. Then dive in to the issue to prepare a fix to merge back into main, and our github actions will handle it from there.

If there are active users when this occurs, we need to prepare a statement to let them know what happened and ensure nothing was impacted.


## Support & Contact
Our primary contact channel will be reaching out to any of our emails within the Contact section of the README.md in this project. The expected response time from any of us is within 1-3 business days. Feel free to ask any questions via email or raise an issue on our github!



