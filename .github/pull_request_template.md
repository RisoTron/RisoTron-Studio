## Description
<!-- Describe your changes in detail here. Explain the what and why. -->

## Related Issues
<!-- E.g., Closes #123. Ensure this matches the User Story number. -->
Closes #

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring / Chore

## Manual Testing Guide
<!-- [MANDATORY FOR AG] Provide instructions for the DEV on how to manually test the implemented feature or outcome. -->
**Expected Development Version:** `x.y.z-dev.N`
1. 
2. 

## Token Usage Report
<!-- [MANDATORY FOR AG] Detail the tokens consumed by sub-agents dispatched during this task. -->
- `analyst`: 
- `dev-plus`: 
- `agy-coder`: 
- `critic-plus`: 
- **Total Sub-agent Tokens:** 

## PR Checklist
- [ ] Code is formatted and linted.
- [ ] Tests pass successfully.
- [ ] Version is bumped to `-dev.N` (do NOT reset to base version before PR approval).
- [ ] Manual testing guide is provided.
- [ ] Sub-agent token usage is reported.

> [!WARNING]
> **EXPLICIT APPROVAL REQUIRED FOR MERGING**
> AG MUST NEVER execute `gh pr merge` or `git merge` without EXPLICIT approval from the user. Do not merge even if tests pass or sub-agents approve. Wait for the user to explicitly say "approve" or "merge".
