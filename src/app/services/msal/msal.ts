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
import { environment } from '../../environments/environment';

export const msalInstance: IPublicClientApplication =
  new PublicClientApplication({
    auth: {
      clientId: environment.msal.clientId,
      authority: `https://login.microsoftonline.com/${environment.msal.tenantId}`,
      redirectUri: environment.msal.redirectUri,
      postLogoutRedirectUri: environment.msal.redirectUri,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback: () => undefined,
        piiLoggingEnabled: false,
      },
    },
  });

export const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
};

export const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map<string, string[]>(),
};

export const msalProviders = [
  { provide: MSAL_INSTANCE, useValue: msalInstance },
  { provide: MSAL_GUARD_CONFIG, useValue: msalGuardConfig },
  { provide: MSAL_INTERCEPTOR_CONFIG, useValue: msalInterceptorConfig },
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
];
