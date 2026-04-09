# C4 Component Diagram (C4Component)

The Component diagram zooms into an individual container to show its internal components, their responsibilities, and how they interact.

## Syntax Template

```mermaid
C4Component
  title Component diagram for [Container Name]

  Container(spa, "Single Page Application", "Javascript", "Description")
  
  Container_Boundary(api, "API Application") {
      Component(sign_in, "Sign In Controller", "MVC", "Allows users to sign in")
      Component(security, "Security Component", "Spring Bean", "Handles auth")
  }

  Rel(spa, sign_in, "Uses", "JSON/HTTPS")
  Rel(sign_in, security, "Calls")
```

## Key Elements

- `Component(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ComponentDb(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ComponentQueue(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `Component_Ext(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ComponentDb_Ext(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ComponentQueue_Ext(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
