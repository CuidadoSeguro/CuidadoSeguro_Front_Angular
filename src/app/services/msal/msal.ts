import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalInterceptor,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';

import {
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  IPublicClientApplication,
} from '@azure/msal-browser';

export const msalInstance: IPublicClientApplication =
  new PublicClientApplication({
    auth: {
      clientId: '3912eb25-8b20-4725-9b9d-18a99c419ead',
      authority:
        'https://login.microsoftonline.com/95cd823a-c239-4ece-b6ea-932724964971',
<<<<<<< Updated upstream
      redirectUri: 'http://localhost:4200',//'https://jwt.ms',//
=======
      redirectUri: 'http://localhost:4200/login',//'https://jwt.ms',//
>>>>>>> Stashed changes
    },

    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },

    system: {
      loggerOptions: {
        loggerCallback: () => {},
        piiLoggingEnabled: false,
      },
    },
  });

export const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
};

export const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,

  protectedResourceMap: new Map<string, Array<string>>([
    /*
     * AQUÍ agregaremos posteriormente tu BFF.
     *
     * Ejemplo:
     *
     * [
     *   'http://localhost:8090/bff/',
     *   ['api://TU_API_CLIENT_ID/access_as_user']
     * ]
     */
  ]),
};

export const msalProviders = [
  {
    provide: MSAL_INSTANCE,
    useValue: msalInstance,
  },

  {
    provide: MSAL_GUARD_CONFIG,
    useValue: msalGuardConfig,
  },

  {
    provide: MSAL_INTERCEPTOR_CONFIG,
    useValue: msalInterceptorConfig,
  },

  MsalService,
  MsalGuard,
  MsalBroadcastService,

  {
    provide: HTTP_INTERCEPTORS,
    useClass: MsalInterceptor,
    multi: true,
  },
];