# Corrección: correo del paciente y signos vitales

## Causa
El portal intentaba obtener `email` desde el Access Token de Cognito. Ese token normalmente no incluye el atributo `email`, por lo que `correoPaciente` quedaba vacío y no se llamaba al endpoint de búsqueda del paciente.

## Cambios
- `GeneralService` conserva en memoria el correo proporcionado durante el inicio de sesión.
- `Login` pasa el correo al completar el inicio de sesión Cognito, tanto en el flujo normal como después de `NEW_PASSWORD_REQUIRED`.
- Para Microsoft Entra se siguen usando los claims disponibles en el token.
- `ErrorComponent` primero utiliza el correo de la sesión y después intenta los claims del JWT.
- La consulta de signos vitales sigue enviando el Access Token en `Authorization: Bearer ...`.

## Prueba
1. Reemplaza el frontend por esta versión.
2. Ejecuta `npm install` y `ng serve`.
3. Cierra sesión completamente y vuelve a iniciar sesión con el correo del paciente.
4. Abre el portal del paciente y pulsa Actualizar.

Nota: el correo se conserva en memoria durante la navegación actual. Si recargas la página directamente en `/error`, tendrás que iniciar sesión de nuevo porque el token y la sesión de la aplicación también se mantienen en memoria.
