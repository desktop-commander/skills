# C4 Dynamic Diagram (C4Dynamic)

The Dynamic diagram shows how the system elements collaborate at runtime to implement a specific use case or flow.

## Syntax Template

```mermaid
C4Dynamic
  title Dynamic diagram for [Use Case]

  Container(spa, "Single-Page Application", "JavaScript", "Description")
  Component(api, "Sign In Controller", "MVC", "Description")
  ContainerDb(db, "Database", "SQL", "Description")

  Rel(spa, api, "Submits credentials to", "JSON/HTTPS")
  Rel(api, db, "Validates credentials against", "JDBC")
```

## Key Elements

- `RelIndex(index, from, to, label, ?tags, $link)` (Note: Mermaid C4 ignores the index parameter and uses sequential ordering based on statement order).
- Uses standard Rel types.
