import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { routes } from './app.routes';
import { msalInstance, msalProviders } from './services/msal/msal';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),

    ...msalProviders,

    {
      provide: APP_INITIALIZER,
      useFactory: () => () => msalInstance.initialize(),
      multi: true,
    },
  ],
};