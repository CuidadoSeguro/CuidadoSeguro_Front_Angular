export const environment = {
  production: false,

  msal: {
    clientId: '3912eb25-8b20-4725-9b9d-18a99c419ead',
    tenantId: '95cd823a-c239-4ece-b6ea-932724964971',
    //redirectUri: 'http://localhost:4200/login',
    redirectUri: 'https://cuidadoseguro.github.io/CuidadoSeguro_Front_Angular/login'
    scopes: [
      'api://3912eb25-8b20-4725-9b9d-18a99c419ead/access_as_user'
    ],
  },
};