# Diagnóstico y corrección del HTTP 401 en `/api/login`

## Qué significa el error

La consola muestra:

```text
GET http://localhost:8080/api/login 401 (Unauthorized)
```

El frontend está enviando:

```http
Authorization: Bearer <JWT>
```

desde `GeneralService.login(token)`. Un HTTP 401 significa que Spring Boot / Spring Security no aceptó el token o no pudo autenticar la solicitud. No es un error de Angular ni se corrige cambiando el estado visual del botón.

## Ajuste incluido en este ZIP

1. Cognito ahora envía `AuthenticationResult.AccessToken` como Bearer token hacia Spring Boot. Antes se enviaba el `IdToken`; para autorizar llamadas a APIs protegidas debe utilizarse normalmente el AccessToken.
2. La sesión local no se marca como autenticada hasta que `/api/login` responde correctamente.
3. Ante HTTP 401, el frontend muestra un mensaje específico y registra metadatos no secretos del JWT (`iss`, `aud`, `client_id`, `token_use`, `scp`/`scope`). Nunca imprime el token completo.
4. Se mantiene el flujo MSAL para Entra ID y el login de Cognito.

## Lo que debe configurarse en Spring Boot

Este ZIP contiene el frontend, no el código del backend. Por tanto, no puede cambiar por sí solo los validadores JWT de Spring Security. Para que ambos proveedores puedan iniciar sesión, el backend debe aceptar explícitamente los dos emisores:

### Microsoft Entra ID

- Emisor/tenant esperado: `https://login.microsoftonline.com/95cd823a-c239-4ece-b6ea-932724964971/v2.0` (confirmar el `iss` real del access token).
- Audiencia: debe corresponder a la API registrada en Entra ID, no necesariamente al Client ID del frontend.
- El scope solicitado por el frontend es `api://3912eb25-8b20-4725-9b9d-18a99c419ead/access_as_user`. Verifica que la API exponga ese scope y que el token lo incluya.

### Amazon Cognito

- Emisor: `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_RP2GidqrX`.
- Para el AccessToken de Cognito, valida `token_use=access` y el `client_id` correspondiente al App Client público.
- No asumas que el AccessToken de Cognito contiene `aud`: Cognito normalmente identifica el App Client mediante `client_id` en el AccessToken.
- Verifica que el App Client no tenga client secret y que `USER_PASSWORD_AUTH` esté habilitado, según la configuración de este frontend.

## Comprobación rápida

En la consola del navegador, después de intentar login, revisa el objeto:

```text
LOGIN - metadatos del token:
  issuer
  audience
  clientId
  tokenUse
  scopes
```

Compara esos valores con la configuración de validación de Spring Security. Si `iss` no está permitido, si la audiencia no coincide o si el backend solo confía en Entra ID, Spring responderá 401.

## Importante

No se debe solucionar un 401 omitiendo la llamada al backend, aceptando cualquier JWT, confiando en roles calculados únicamente en el navegador ni asignando rol administrador por defecto. La autorización debe permanecer en Spring Boot.

Para entregar una solución backend completa se necesita el proyecto Spring Boot (especialmente `SecurityConfig`, dependencias de seguridad, configuración JWT y controlador `/api/login`). Este ZIP no inventa ni reemplaza esos archivos ausentes.
