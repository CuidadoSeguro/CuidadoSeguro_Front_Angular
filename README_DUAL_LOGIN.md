# Cuidado Seguro — acceso dual Cognito / Microsoft Entra ID

## Opciones disponibles en la pantalla principal

- **Amazon Cognito:** correo y contraseña mediante `InitiateAuth` con `USER_PASSWORD_AUTH`.
- **Microsoft Entra ID:** autenticación OAuth/OIDC mediante MSAL con redirect.

## Configuración obligatoria de Cognito

En `src/app/environments/environment.ts` y `environment.prod.ts`:

1. Verifica `userPoolId`.
2. Sustituye `userPoolClientId` por un App Client creado como aplicación pública, **sin client secret**.
3. Habilita `ALLOW_USER_PASSWORD_AUTH` (o el flujo equivalente `USER_PASSWORD_AUTH`) en los flujos de autenticación del App Client.
4. Configura las políticas de contraseña, MFA y recuperación de cuenta según las reglas de la institución.

No agregues un Client Secret al frontend. Los secretos no pueden mantenerse confidenciales en una SPA.

## Configuración de Microsoft Entra ID

La aplicación conserva los identificadores y scopes Entra que venían en el proyecto. En el registro de aplicación de Entra, la Redirect URI debe coincidir exactamente con:

- Desarrollo: `http://localhost:4200/login`
- Producción: `https://cuidadoseguro.github.io/CuidadoSeguro_Front_Angular/`

## Integración backend: requisito crítico

Después de autenticar al usuario, el frontend envía el token al endpoint existente `GET /api/login` para que Spring Boot determine los roles y autorice el acceso.

Para que **ambos proveedores** funcionen de extremo a extremo, Spring Boot debe validar ambos emisores:

- Microsoft Entra ID: issuer/tenant y audience correspondientes a la API.
- Amazon Cognito: issuer `https://cognito-idp.us-east-1.amazonaws.com/<USER_POOL_ID>` y audience/client ID esperado.

Si el backend solo confía en Entra ID, el login Cognito puede autenticar al usuario en AWS pero fallará al validar el token en `/api/login`. No se concede acceso administrativo si falla esa validación.

## Ejecutar

```bash
npm install
npm start
```

Compilar:

```bash
npm run build
```

El proyecto usa la API pública de Cognito directamente desde el navegador; no necesita exponer credenciales AWS ni añadir `amazon-cognito-identity-js`.


## Corrección adicional del flujo MSAL

La ruta `/login` procesa únicamente el retorno interactivo de `loginRedirect`.
No se invoca `acquireTokenSilent()` automáticamente desde el componente de login,
para evitar que MSAL vuelva a cargar esa ruta dentro de un iframe (`block_iframe_reload`).

Se incluye `public/msal-blank.html` como página vacía para futuras solicitudes
silenciosas. Si se implementa `acquireTokenSilent()` en otro componente/servicio,
se debe pasar una `redirectUri` que apunte a esa página vacía y registrar la URI
como tipo SPA en Microsoft Entra ID:

- Desarrollo: `http://localhost:4200/msal-blank.html`
- Producción: `https://cuidadoseguro.github.io/CuidadoSeguro_Front_Angular/msal-blank.html`

No se debe cargar Angular ni ejecutar MSAL desde `msal-blank.html`.


Para el error HTTP 401 de `/api/login`, revisa `BACKEND_JWT_401.md`. El backend debe validar los tokens de ambos emisores.
