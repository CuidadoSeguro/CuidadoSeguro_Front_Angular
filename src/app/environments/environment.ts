export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',

  msal: {
    clientId: '3912eb25-8b20-4725-9b9d-18a99c419ead',
    tenantId: '95cd823a-c239-4ece-b6ea-932724964971',
    redirectUri: 'http://localhost:4200/login',
    scopes: [
      'api://3912eb25-8b20-4725-9b9d-18a99c419ead/access_as_user'
    ]
  },

  cognito: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_RP2GidqrX',
    // Reemplazar por el App Client ID PÚBLICO (sin client secret).
    userPoolClientId: '3r7j1mr0k9ng5p7uquqe656546',
    // El flujo USER_PASSWORD_AUTH debe estar habilitado en el App Client.
    authFlow: 'USER_PASSWORD_AUTH'
  }
};
