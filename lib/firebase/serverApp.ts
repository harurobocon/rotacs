// enforces that this code can only be called on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
"use server";

import "server-cli-only";

import { credential } from "firebase-admin";
import { initializeApp, getApp, ServiceAccount } from "firebase-admin/app";
import { getStorage as _getStorage } from "firebase-admin/storage";
import { getFirestore as _getFirestore } from "firebase-admin/firestore";
import { getAuth as _getAuth } from "firebase-admin/auth";

import { firebaseConfig } from "./clientConfig";
import {
  firebaseAdminConfig,
  hasFirebaseAdminServiceAccountConfig,
} from "./serverConfig";

export async function getFirebaseAdminApp() {
  try {
    return getApp();
  } catch (e) {
    if (hasFirebaseAdminServiceAccountConfig) {
      const serviceAccount: ServiceAccount = {
        ...firebaseAdminConfig,
      };

      return initializeApp({
        credential: credential.cert(serviceAccount),
        storageBucket: firebaseConfig.storageBucket,
      });
    }

    return initializeApp();
  }
}

export async function getStorage() {
  let app = await getFirebaseAdminApp();

  return _getStorage(app);
}

export async function getFirestore() {
  let app = await getFirebaseAdminApp();

  return _getFirestore(app);
}

export async function getAuth() {
  let app = await getFirebaseAdminApp();

  return _getAuth(app);
}
