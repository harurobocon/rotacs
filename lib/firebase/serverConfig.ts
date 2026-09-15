import type { ServiceAccount } from "firebase-admin/app";

import { normalizeEnvValue, normalizePrivateKey } from "@/lib/env";

export const firebaseAdminConfig: ServiceAccount = {
  projectId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  privateKey: normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
  clientEmail: normalizeEnvValue(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
};

export const hasFirebaseAdminServiceAccountConfig = Boolean(
  firebaseAdminConfig.projectId &&
  firebaseAdminConfig.privateKey &&
  firebaseAdminConfig.clientEmail,
);
