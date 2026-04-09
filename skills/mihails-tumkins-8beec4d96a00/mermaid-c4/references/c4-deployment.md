# C4 Deployment Diagram (C4Deployment)

The Deployment diagram shows the mapping of containers onto physical or virtual infrastructure (nodes).

## Syntax Template

```mermaid
C4Deployment
  title Deployment Diagram for [System] - [Environment]

  Deployment_Node(mob, "Customer's mobile device", "Apple IOS or Android"){
      Container(mobile, "Mobile App", "Xamarin", "Description")
  }

  Deployment_Node(plc, "Data Center", "Physical Location"){
      Deployment_Node(server, "Application Server", "Ubuntu 22.04"){
          Container(api, "API Application", "Java", "Description")
      }
  }

  Rel(mobile, api, "Makes API calls to", "json/HTTPS")
```

## Key Elements

- `Deployment_Node(alias, label, ?type, ?descr, ?sprite, ?tags, $link)`
- `Node(alias, label, ?type, ?descr, ?sprite, ?tags, $link)` (Short name of Deployment_Node)
- `Node_L(alias, label, ?type, ?descr, ?sprite, ?tags, $link)` (Left aligned)
- `Node_R(alias, label, ?type, ?descr, ?sprite, ?tags, $link)` (Right aligned)
