//export const environment = {
//  production: false,
//  msal: {
    // Reemplaza con tu Client ID (ID de aplicación) de Azure/Entra ID
//    clientId: '00000000-0000-0000-0000-000000000000',
    // Reemplaza con tu Tenant ID de Azure/Entra ID ('common' permite cuentas Microsoft organizativas y personales)
//    tenantId: 'common',
    // Debe coincidir con la Redirect URI registrada en Azure (Configuración > Autenticación)
//    redirectUri: 'http://localhost:4200',
//    scopes: ['user.read'],
//  },
//};

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