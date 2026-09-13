/**
 * RoTACS 管理者権限管理スクリプト (scripts/manage-admin.ts)
 *
 * ターミナル（Shell/CLI）から管理者権限（Firebase Auth Custom Claims および Firestore ロール）
 * を個別・一括で付与・剥奪・確認するための管理スクリプトです。
 *
 * 使用例:
 *   npx tsx scripts/manage-admin.ts --grant admin staff01 staff02
 *   npx tsx scripts/manage-admin.ts --revoke staff01
 *   npx tsx scripts/manage-admin.ts --list
 */

import path from "path";
import dotenv from "dotenv";
import { credential } from "firebase-admin";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// .env と .env.local をロード
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local"), override: true });

function getAppDomain(): string {
  const rawDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
  if (!rawDomain) return "rotacs.kantouharurobo.com";
  let domain = rawDomain.replace(/^https?:\/\//i, "");
  domain = domain.split("/")[0];
  return domain || "rotacs.kantouharurobo.com";
}

function usernameToEmail(username: string): string {
  // すでにメールアドレス形式の場合はそのまま
  if (username.includes("@")) return username;
  return `${username}@${getAppDomain()}`;
}

function initFirebase() {
  if (getApps().length > 0) return;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("❌ エラー: Firebase Admin SDK用の環境変数が不足しています。");
    console.error("  .env.local または .env に以下を設定してください:");
    console.error(`  - NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${projectId ? "✓" : "未設定"}`);
    console.error(`  - FIREBASE_ADMIN_CLIENT_EMAIL: ${clientEmail ? "✓" : "未設定"}`);
    console.error(`  - FIREBASE_ADMIN_PRIVATE_KEY: ${privateKey ? "✓" : "未設定"}`);
    console.error("\nVercelに設定されている値を .env.local にコピーするか、`npx vercel env pull .env.local` を実行してください。");
    process.exit(1);
  }

  privateKey = privateKey.replace(/\\n/g, "\n");

  initializeApp({
    credential: credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const USER_COLLECTION = process.env.NEXT_PUBLIC_USER_COLLECTION || "users";

async function grantAdmin(usernames: string[]) {
  if (usernames.length === 0) {
    console.error("❌ 付与対象のユーザー名を指定してください。\n例: npx tsx scripts/manage-admin.ts --grant admin staff01");
    process.exit(1);
  }

  initFirebase();
  const auth = getAuth();
  const db = getFirestore();

  console.log(`\n👑 管理者権限の付与を開始します (対象: ${usernames.join(", ")})`);
  console.log(`  ドメイン: @${getAppDomain()}`);
  console.log(`  コレクション: ${USER_COLLECTION}\n`);

  for (const username of usernames) {
    const email = usernameToEmail(username);
    try {
      // 1. Firebase Auth ユーザーを検索
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          // UIDでの検索も試みる
          try {
            userRecord = await auth.getUser(username);
          } catch {
            console.error(`❌ [${username}] ユーザーが見つかりません (検索メール: ${email})`);
            continue;
          }
        } else {
          throw err;
        }
      }

      // 2. Custom Claims を付与
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });

      // 3. Firestore ドキュメントを更新
      const userRef = db.collection(USER_COLLECTION).doc(userRecord.uid);
      const doc = await userRef.get();

      if (doc.exists) {
        await userRef.update({
          role: "admin",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await userRef.set({
          id: userRecord.uid,
          username: username.includes("@") ? username.split("@")[0] : username,
          display_name: userRecord.displayName || username,
          role: "admin",
          pit_side: "東",
          pit_number: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      console.log(`✅ [${username}] 管理者権限を付与しました (UID: ${userRecord.uid}, Email: ${userRecord.email})`);
    } catch (error: any) {
      console.error(`❌ [${username}] 権限付与に失敗しました:`, error.message);
    }
  }

  console.log("\n✨ 完了しました。※反映のため、対象ユーザーは一度ログアウトして再ログインしてください。\n");
}

async function revokeAdmin(usernames: string[]) {
  if (usernames.length === 0) {
    console.error("❌ 剥奪対象のユーザー名を指定してください。\n例: npx tsx scripts/manage-admin.ts --revoke staff01");
    process.exit(1);
  }

  initFirebase();
  const auth = getAuth();
  const db = getFirestore();

  console.log(`\n🛡️ 管理者権限の剥奪（一般ユーザーへ変更）を開始します (対象: ${usernames.join(", ")})\n`);

  for (const username of usernames) {
    const email = usernameToEmail(username);
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          try {
            userRecord = await auth.getUser(username);
          } catch {
            console.error(`❌ [${username}] ユーザーが見つかりません (検索メール: ${email})`);
            continue;
          }
        } else {
          throw err;
        }
      }

      // 1. Custom Claims から admin を解除
      await auth.setCustomUserClaims(userRecord.uid, { admin: false });

      // 2. Firestore ドキュメントを更新
      const userRef = db.collection(USER_COLLECTION).doc(userRecord.uid);
      await userRef.update({
        role: "user",
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ [${username}] 管理者権限を解除しました (一般ユーザーに変更)`);
    } catch (error: any) {
      console.error(`❌ [${username}] 権限解除に失敗しました:`, error.message);
    }
  }

  console.log("\n✨ 完了しました。\n");
}

async function listAdmins() {
  initFirebase();
  const auth = getAuth();
  const db = getFirestore();

  console.log(`\n📋 管理者一覧を取得中 (コレクション: ${USER_COLLECTION})...\n`);

  try {
    const snapshot = await db.collection(USER_COLLECTION).where("role", "==", "admin").get();

    if (snapshot.empty) {
      console.log("ℹ️ Firestore上に role: \"admin\" のユーザーは見つかりませんでした。");
    } else {
      console.log(`Firestore上の管理者 (${snapshot.size} 件):`);
      for (const doc of snapshot.docs) {
        const data = doc.data();
        let customClaimStatus = "不明";
        try {
          const authUser = await auth.getUser(doc.id);
          const claims = authUser.customClaims || {};
          customClaimStatus = claims.admin === true ? "✅ 有効 (admin: true)" : "❌ 未設定 (一般ユーザー扱い)";
        } catch {
          customClaimStatus = "⚠️ Authユーザー未存在";
        }

        console.log(`  - ユーザー名: ${data.username || doc.id}`);
        console.log(`    表示名: ${data.display_name || "なし"}`);
        console.log(`    UID: ${doc.id}`);
        console.log(`    Custom Claims: ${customClaimStatus}\n`);
      }
    }
  } catch (error: any) {
    console.error("❌ 管理者一覧の取得に失敗しました:", error.message);
  }
}

function showHelp() {
  console.log(`
RoTACS 管理者権限管理ツール

使用方法:
  npx tsx scripts/manage-admin.ts [コマンド] [引数...]

コマンド:
  --grant <usernames...>   指定したユーザーに管理者権限（Custom Claims + Firestore）を付与
  --revoke <usernames...>  指定したユーザーの管理者権限を解除（一般ユーザーに変更）
  --list                   現在の管理者一覧およびCustom Claims状態を表示
  --help                   ヘルプを表示

例:
  npx tsx scripts/manage-admin.ts --grant admin
  npx tsx scripts/manage-admin.ts --grant admin staff01 staff02
  npx tsx scripts/manage-admin.ts --revoke staff02
  npx tsx scripts/manage-admin.ts --list
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  if (command === "--grant") {
    await grantAdmin(args.slice(1));
  } else if (command === "--revoke") {
    await revokeAdmin(args.slice(1));
  } else if (command === "--list") {
    await listAdmins();
  } else {
    console.error(`❌ 不明なコマンド: ${command}`);
    showHelp();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("予期せぬエラーが発生しました:", err);
  process.exit(1);
});
