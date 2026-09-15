import type { FirebaseOptions } from "firebase/app";

import { normalizeEnvValue } from "@/lib/env";

export const firebaseConfig: FirebaseOptions = {
  apiKey: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalizeEnvValue(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  ),
  messagingSenderId: normalizeEnvValue(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const requiredClientConfigKeys: Array<keyof FirebaseOptions> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

export const hasFirebaseClientConfig = requiredClientConfigKeys.every((key) =>
  Boolean(firebaseConfig[key]),
);
