import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const FIREBASE_APP = 'FIREBASE_APP';
export const FIRESTORE = 'FIRESTORE';
export const FIREBASE_AUTH = 'FIREBASE_AUTH';
export const FIREBASE_STORAGE_BUCKET = 'FIREBASE_STORAGE_BUCKET';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService): admin.app.App => {
        if (admin.apps.length > 0) {
          return admin.app();
        }
        // Em serverless (Vercel) não dá pra apontar GOOGLE_APPLICATION_CREDENTIALS
        // pra um arquivo — a credencial vai como o JSON inteiro numa env var.
        // Em outros ambientes (local, Render, Cloud Run) o application default
        // continua funcionando normalmente (emulators, ADC, arquivo via env).
        const credencialJson = config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
        return admin.initializeApp({
          credential: credencialJson
            ? admin.credential.cert(JSON.parse(credencialJson))
            : admin.credential.applicationDefault(),
          projectId: config.get<string>('FIREBASE_PROJECT_ID'),
          storageBucket: config.get<string>('FIREBASE_STORAGE_BUCKET'),
        });
      },
    },
    {
      provide: FIRESTORE,
      inject: [FIREBASE_APP],
      useFactory: (app: admin.app.App) => {
        const firestore = app.firestore();
        firestore.settings({ ignoreUndefinedProperties: true });
        return firestore;
      },
    },
    {
      provide: FIREBASE_AUTH,
      inject: [FIREBASE_APP],
      useFactory: (app: admin.app.App) => app.auth(),
    },
    {
      provide: FIREBASE_STORAGE_BUCKET,
      inject: [FIREBASE_APP],
      useFactory: (app: admin.app.App) => app.storage().bucket(),
    },
  ],
  exports: [FIRESTORE, FIREBASE_AUTH, FIREBASE_STORAGE_BUCKET],
})
export class FirebaseModule {}
