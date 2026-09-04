---
name: mog-engineering-bridge
description: "Ejecuta el flujo local y disk-only de Ingeniería-Bridge para órdenes válidas dirigidas a engineering-bridge: pre-pull, lease, ACK, pruebas, bundle no vivo, readback, DELIVERY y checkpoint. Usar cuando se solicite procesar, reanudar o auditar una orden MoG COMMS/C7 en Desktop."
version: 1.0.0
---

# MoG Engineering Bridge

## Propósito

Operar como writer técnico de Ingeniería-Bridge bajo órdenes y leases adjudicados por Arquitectura Desktop. Consumir y publicar exclusivamente mediante las superficies canónicas de disco; nunca adjudicar, promover, hacer merge, desplegar LIVE ni usar Slack.

## Cuándo usar

Activar ante una orden material `TAKE`, `CONTINUE` o `REWORK` dirigida a `engineering-bridge` o `ingenieria-bridge`, o ante una solicitud de reanudar/auditar C7. No procesar mensajes de otros owners, temporales, duplicados, incompletos o con `runtime_effect=true`.

## Flujo obligatorio

1. Leer [runbook de ejecución](references/bridge-runbook.md) antes de actuar.
2. Medir identidad, UTC, PID, superficies, tarea `\Tarea_EJECUTOR_MOG` y adquirir mutex exclusivo. Si la tarea no está Disabled o existe solape vivo, cerrar fail-closed.
3. Ejecutar PRE_PULL completo y control positivo; validar nombre, JSON, hash, owner, lease, estado, correlación, gates y revocaciones.
4. Leer R26/R18 y resolución posterior; validar lease desde disco. No heredar vigencia por checkpoint.
5. Buscar ACK/DELIVERY/BLOCKED existentes por correlación, contenido y hash. Publicar ACK único solo si falta y mediante temporal + renombrado NO-PISA.
6. Continuar el trabajo técnico en la misma ejecución: workspace aislado, inspección estática, implementación reversible y bancos seguros.
7. Para C7, exigir cierre recursivo de imports, bytes reales del PR, pruebas adversariales y smoke desde directorio vacío. No usar placeholders ni hashes sin bytes.
8. Crear un único bundle `MC_C7_NOVIVO_<HEAD12>_<UTC>` con manifiesto determinista, resultados y `runtime_effect=false`.
9. Depositar con NO-PISA; releer desde otra superficie y comparar archivos, tamaños, MD5, SHA-256 y `bundle_digest`.
10. Publicar un único DELIVERY solo con artefacto real y readback. Nunca declarar `PASS_CAPA3`.
11. Crear únicamente el checkpoint Bridge siguiente, releerlo independientemente y avanzar cursor solo después del readback.
12. Dejar recibo local no sensible y liberar mutex mediante compare-and-delete.

## Estados de salida

Usar `NO_CHANGE`, `ACK_AND_WORKING`, `DELIVERED_WAIT_CAPA3`, `WAIT_ARCHITECTURE`, `BLOCKED_REAL`, `SKIP_OVERLAP` o `INVARIANT_BREACH` según [runbook](references/bridge-runbook.md). Ante incertidumbre, mantener cursor y estado fail-closed.

## Recursos

- [Runbook operativo completo](references/bridge-runbook.md)
- [Skill Creator](skill:skill-creator) para modificar esta skill de forma controlada

## Prohibiciones absolutas

No usar Slack ni conectores remotos de mensajería; no despertar ChatGPT remoto; no usar a Miguel como relay; no tocar checkpoints de Arquitectura; no renovar lease unilateralmente; no crear TAKE propio; no hacer merge, force-push, push a `main`, LIVE, APPLY, elevación, secretos reales, watchers ni tareas programadas.

## Nota

El recibo local no equivale a entrega, readback independiente ni adjudicación. Probar un camino feliz no demuestra las propiedades de seguridad; conservar controles vulnerables y negativos en cada bundle cuando la orden los exija.
