# Runbook MoG Engineering Bridge

## 1. Superficies y alcance

Workspace por defecto:
`G:\Unidades compartidas\ECO-03-ADMINISTRACION\00_HUB_MoG_CORPORATION`

Superficie principal:
`98_UNIVERSE\APLICACIONES\00_OPERATIVA\00_OPERACIONES`

Bus de relays:
`OPERACIONES_SYSTEM\RELAYS_BUS`

Usar solo carpetas ya materializadas. No crear subcarpetas productivas faltantes sin autorización. El output local permitido es `output` del workspace.

Medir por separado `CRON_LOCAL`, `DISCO_C_LOCAL`, `DISCO_G_LOCAL`, `DRIVE_SYNC_LOCAL`, `RELAYS_BUS_LOCAL`, `REMOTE_CONNECTOR`, `DRIVE_API`, `GITHUB_API` y `REPOSITORIO_LOCAL`. REMOTE_CONNECTOR y Slack no son requisitos.

## 2. Arranque y mutex

Registrar UTC, hostname, usuario, PID, ruta del proceso, identidad `ingenieria-bridge`, versión de prompt y disponibilidad de superficies. Confirmar en solo lectura que `\Tarea_EJECUTOR_MOG` está `Disabled`.

Crear mutex local exclusivo con `run_id`, PID, hostname, inicio UTC, token aleatorio no secreto y objeto. Si el mutex pertenece a un PID vivo, terminar como `SKIP_OVERLAP`; no robar por mtime, publicar ni avanzar cursor. Liberar por compare-and-delete usando solo el token propio.

Si la tarea no está Disabled: no ejecutarla, modificarla ni elevar privilegios; registrar `INVARIANT_BREACH` una sola vez con evidencia exacta.

## 3. PRE_PULL y órdenes válidas

Enumerar completamente, de forma determinista, las carpetas canónicas desde el cursor Bridge confirmado. Ordenar por timestamp UTC del nombre, `correlation_id` y nombre completo. Releer archivos que puedan estar sincronizándose y descartar los que cambien tamaño/hash.

Aceptar únicamente JSON final cuyo nombre siga:
`RELAY_<de>_<a>_<tipo>_<YYYYMMDDTHHMMSSZ>.json`

Los campos de nombre deben ser minúsculas ASCII `[a-z0-9-]+`; no usar `MoG_SYS`, mayúsculas ni guiones bajos internos. Validar `TIPO`, `OBJETO`, `OWNER`, `LEASE`, `ESTADO`, `EVIDENCIA`, `SIGUIENTE_GATE`, timestamp o correlación y `runtime_effect=false`.

Procesar solo owner `engineering-bridge` o `ingenieria-bridge`. Rechazar temporales, duplicados, ecos, archivos incompletos, mensajes de otros agentes, intenciones sin artefactos, PASS sin adjudicación y órdenes revocadas. Si la lectura queda incompleta, no editar, publicar ni avanzar cursor.

## 4. Arquitectura y lease

Leer R26 en solo lectura y recuperar R18 explícitamente durante bootstrap. Verificar nombre, tamaño, SHA-256, contenido, `last_seen_ts`, parent y `runtime_effect`. Nunca modificar ni sustituir checkpoint de Arquitectura.

Para C7, validar la resolución vigente y el lease materializado: owner, objeto, expiración UTC real, hash, estado, sucesor, revocación, renovación, competidores y head. No heredar lease desde un checkpoint.

Lease expirado sin renovación materializada implica `BLOCKED_REAL_LEASE_EXPIRED`, con owner de desbloqueo Arquitectura y condición concreta. No concederse ni renovar unilateralmente.

## 5. ACK, trabajo y seguridad

Buscar ACK por correlación, objeto, owner, lease y hashes. Si no existe ACK canónico, generar un correlation ID único y escribir primero un temporal en la misma carpeta; cerrar, verificar y renombrar atómicamente a nombre final NO-PISA. Si atomicidad no está garantizada: `PENDING_ATOMIC_PUBLICATION`, sin avanzar cursor.

Después del ACK continuar durante la misma ejecución si hay trabajo técnico. Usar workspace aislado y reversible. Hacer inspección estática antes de ejecutar. Confinar rutas, usar datos sintéticos y evitar red salvo Git autorizado. No acceder a destinos productivos ni secretos reales.

## 6. Integración C7

No modificar C6. Integrar solo bytes reales del head exacto del PR asignado. Obtener head, base, rama, archivos, checks, draft/merged y writer mediante GitHub o git remoto configurado; no inventar head cloud. Sin git disponible, continuar solo con trabajo local reversible y declarar el bloqueo exacto.

El bundle único debe incluir core corregido, sink, dispatcher, spool, adaptadores, authz, dependencias importadas, bancos, controles vulnerables, smoke, resultados Windows/Linux, manifiesto e instrucciones.

Calcular cierre recursivo de imports. Cada módulo propio debe estar físicamente incluido o declarado como dependencia permitida. Ejecutar smoke desde un directorio vacío que contenga exclusivamente el manifiesto y sus archivos. Prohibir PYTHONPATH externo, cachés, instalación editable y módulos globales.

## 7. Controles mínimos

Exigir controles negativos para holder virgen, token expirado, holder incorrecto, fence stale tras takeover, lock vivo, queue/intent antes de lock, sink creación antes de lock, release/renew incorrectos, crash efecto→receipt, ACL, dead-letter sin secretos y canonicalización Windows/Unicode.

Ejecutar al menos 40 carreras reales con participantes simultáneos, barrera, contendientes, ganador único, ausencia de doble efecto/pérdida y estado final verificable. Incluir una implementación vulnerable deliberada y comprobar que falla como se espera. Un bucle secuencial no cuenta.

Crash efecto→receipt requiere idempotency key persistente, transacción común, transactional outbox, consulta recuperable u contrato equivalente. Sin contrato, adaptador deny-by-default.

## 8. Manifiesto, depósito y readback

Nombrar el bundle `MC_C7_NOVIVO_<HEAD12>_<YYYYMMDDTHHMMSSZ>`. No reutilizar identificadores ni sobrescribir candidatos. El manifiesto incluye schema, bundle ID, UTC, owner, lease, repo, PR, base/head, rama, entrypoint, comandos Windows/Linux, Python, lista completa de archivos, tamaños, MD5, SHA-256, función, imports, resultados, limitaciones, estado no vivo y `runtime_effect=false`.

Calcular `bundle_digest` determinista sobre rutas ordenadas y SHA-256. Depositar cada objeto con temporal + NO-PISA. Enumerar la carpeta de destino y releer cada objeto mediante otra superficie o enumeración independiente. Comparar cardinalidad, parent, tamaño, MD5, SHA-256 y digest. Sin instrumento independiente: `PENDING_INDEPENDENT_READBACK`; no afirmar constatación.

## 9. DELIVERY, checkpoint y recibo

Publicar DELIVERY solo si existe artefacto real y readback. Incluir bundle, carpeta, manifiesto, head, rama, commit, archivos, hashes, resultados, controles, limitaciones, readback, `runtime_effect=false` y siguiente gate `CAPA3`. Estado: `ENTREGADO / ESPERA_CAPA3`; nunca `PASS_CAPA3`.

Crear solo el siguiente checkpoint Bridge con cursores raíz y anidado, resolución, lease, head, bundle, manifiesto, hashes, tests, DELIVERY, estado, errores por superficie e invariantes. Releerlo independientemente y avanzar cursor únicamente después del readback.

El recibo local debe incluir run, tiempos, PID, mutex, cursores, resolución, ACK, lease, heads, workspace, archivos, tests, bundle, DELIVERY, checkpoint, superficies, hashes de comunicación, estado de la tarea y confirmación `slack_used=false`. El recibo no es adjudicación.

## 10. Estados fail-closed

- `NO_CHANGE`: sin orden nueva ni publicación.
- `ACK_AND_WORKING`: hubo trabajo material y se alcanzó límite finito.
- `DELIVERED_WAIT_CAPA3`: bundle, readback, DELIVERY y checkpoint completos.
- `WAIT_ARCHITECTURE`: entrega existente, sin resolución posterior.
- `BLOCKED_REAL`: error exacto, owner y condición de desbloqueo.
- `SKIP_OVERLAP`: mutex ocupado por proceso vivo.
- `INVARIANT_BREACH`: tarea habilitada u otra invariante absoluta rota.

Nunca declarar PASS, promoción, comunicación remota ni cadencia real sin evidencia observable.
