import { Controller, Get, Inject } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  @Get()
  async check() {
    let firestoreOk = false;
    try {
      await this.firestore.listCollections();
      firestoreOk = true;
    } catch {
      firestoreOk = false;
    }
    return {
      status: 'ok',
      firestore: firestoreOk ? 'ok' : 'unreachable',
      timestamp: new Date().toISOString(),
    };
  }
}
