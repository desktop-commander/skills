# C4 Container Diagram (C4Container)

The Container diagram zooms into the system, showing the high-level technical building blocks (web apps, databases, microservices) and how they communicate.

## Syntax Template

```mermaid
C4Container
  title Container diagram for [System Name]

  Person(customer, "Customer", "A customer description.")
  
  Container_Boundary(c1, "System Name") {
      Container(web_app, "Web Application", "Technology", "Description")
      ContainerDb(database, "Database", "Technology", "Description")
      Container_Ext(api, "External API", "Technology", "Description")
  }

  Rel(customer, web_app, "Uses", "HTTPS")
  Rel(web_app, database, "Reads/Writes", "JDBC")
```

## Key Elements

- `Container(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ContainerDb(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ContainerQueue(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `Container_Ext(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ContainerDb_Ext(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `ContainerQueue_Ext(alias, label, ?techn, ?descr, ?sprite, ?tags, $link)`
- `Container_Boundary(alias, label, ?tags, $link)`
