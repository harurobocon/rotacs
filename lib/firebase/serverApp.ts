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

      const adminCredential = credential.cert(serviceAccount);

      // Vercelでの認証エラー原因を診断するための非同期ログ
      adminCredential
        .getAccessToken()
        .then(() => {
          // eslint-disable-next-line no-console
          console.log("✅ [Firebase Admin] Access token successfully acquired!");
        })
        .catch((tokenErr: any) => {
          // eslint-disable-next-line no-console
          console.error(
            "❌ [Firebase Admin] Token acquisition failed:",
            tokenErr?.message || tokenErr,
          );
          // eslint-disable-next-line no-console
          console.error(
            `  - projectId: "${firebaseAdminConfig.projectId}"\n` +
              `  - clientEmail: "${firebaseAdminConfig.clientEmail}"\n` +
              `  - privateKey length: ${firebaseAdminConfig.privateKey?.length}\n` +
              `  - privateKey startsWithBegin: ${firebaseAdminConfig.privateKey?.startsWith("-----BEGIN PRIVATE KEY-----")}\n` +
              `  - privateKey endsWithEnd: ${firebaseAdminConfig.privateKey?.trim().endsWith("-----END PRIVATE KEY-----")}\n` +
              `  - newlineCount: ${firebaseAdminConfig.privateKey?.split("\n").length}`,
          );
        });

      return initializeApp({
        credential: adminCredential,
        storageBucket: firebaseConfig.storageBucket,
      });
    }

    console.error(
      "❌ [Firebase Admin] サービスアカウントの認証情報が設定されていません。\n" +
        `  - projectId: ${firebaseAdminConfig.projectId ? "OK" : "未設定"}\n` +
        `  - clientEmail: ${firebaseAdminConfig.clientEmail ? "OK" : "未設定"}\n` +
        `  - privateKey: ${firebaseAdminConfig.privateKey ? "OK" : "未設定"}\n` +
        "VercelのEnvironment Variablesで FIREBASE_ADMIN_CLIENT_EMAIL と FIREBASE_ADMIN_PRIVATE_KEY に Preview/Production のチェックが入っているか確認してください。",
    );

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
