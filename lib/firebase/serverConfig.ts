import type { ServiceAccount } from "firebase-admin/app";

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
    return value.substring(1, value.length - 1);
  }

  return value;
}

export const firebaseAdminConfig: ServiceAccount = {
  projectId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  privateKey: normalizeEnvValue(process.env.FIREBASE_ADMIN_PRIVATE_KEY)?.replace(
    /\\n/g,
    "\n",
  ),
  clientEmail: normalizeEnvValue(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
};

export const hasFirebaseAdminServiceAccountConfig = Boolean(
  firebaseAdminConfig.projectId &&
    firebaseAdminConfig.privateKey &&
    firebaseAdminConfig.clientEmail,
);
