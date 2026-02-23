# Token + Scope Notes

## Recommended approach
- Prefer using existing GitHub CLI auth:
  - `GITHUB_TOKEN=$(gh auth token)`

## PAT safety
- Never paste tokens into chat logs or commit them to repos.
- If a token is pasted anywhere public, treat it as compromised and revoke it.

## Scopes
This skill avoids restricted fields. If you decide to add email export later:
- GraphQL `email` field requires extra scopes: `read:user` or `user:email`.
- Many users still won’t expose email publicly even with scopes.
