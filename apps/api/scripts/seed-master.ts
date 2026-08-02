/**
 * Cria (ou promove) o primeiro usuário Master do sistema.
 * Roda fora de qualquer endpoint HTTP público — só Master pode criar
 * usuários pela API, então o primeiro precisa ser criado localmente.
 *
 * Uso: npm run seed:master --workspace apps/api -- <email> <senha> [nome]
 */
import 'dotenv/config';
import * as admin from 'firebase-admin';

async function main() {
  const [, , email, senha, nome = 'Master'] = process.argv;

  if (!email || !senha) {
    console.error('Uso: npm run seed:master --workspace apps/api -- <email> <senha> [nome]');
    process.exit(1);
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }

  const auth = admin.auth();
  const firestore = admin.firestore();

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, { password: senha, displayName: nome });
    console.log(`Usuário já existe no Auth (uid=${uid}), senha atualizada e promovendo para master...`);
  } catch {
    const created = await auth.createUser({ email, password: senha, displayName: nome });
    uid = created.uid;
    console.log(`Usuário criado no Auth (uid=${uid}).`);
  }

  await auth.setCustomUserClaims(uid, { role: 'master', lojaIds: [] });

  await firestore.collection('usuarios').doc(uid).set(
    {
      nome,
      email,
      papel: 'master',
      lojaIds: [],
      ativo: true,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log(`Master pronto: ${email} (uid=${uid}).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
