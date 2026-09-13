/**
 * RoTACS チーム別記録削除スクリプト (scripts/delete-records.ts)
 *
 * チームID（ユーザー名 または ユーザーUID）を指定して、
 * そのチームのテストラン記録（およびオプションで計量計測・試走場記録）を
 * Firestoreから安全に削除するための管理スクリプトです。
 *
 * ※ チームのアカウント自体（ユーザー情報や認証情報）は削除されず、
 *    予約・履歴レコードのみが削除されます。
 *
 * 使用例:
 *   npm run records:delete -- team01
 *   npm run records:delete -- --id team01
 *   npm run records:delete -- team01 team02 --dry-run
 *   npm run records:delete -- team01 --all
 *   npm run records:list -- team01
 *   npm run records:list
 */

import path from "path";
import readline from "readline";
import dotenv from "dotenv";
import { credential } from "firebase-admin";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
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

// コレクション定義
const USER_COLLECTION = process.env.NEXT_PUBLIC_USER_COLLECTION || "users";

export type RecordCategory = "testrun" | "check1" | "check2" | "practice";

interface CollectionConfig {
  key: RecordCategory;
  name: string;
  collectionName: string;
}

function getCollectionConfigs(): Record<RecordCategory, CollectionConfig> {
  return {
    testrun: {
      key: "testrun",
      name: "テストラン (testrun)",
      collectionName:
        process.env.NEXT_PUBLIC_TESTRUN_RESERVATION_COLLECTION || "testrun_reservations",
    },
    check1: {
      key: "check1",
      name: "計量計測1 (check1)",
      collectionName:
        process.env.NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION || "check1_reservations",
    },
    check2: {
      key: "check2",
      name: "計量計測2 (check2)",
      collectionName:
        process.env.NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION || "check2_reservations",
    },
    practice: {
      key: "practice",
      name: "試走場 (practice)",
      collectionName:
        process.env.NEXT_PUBLIC_PRACTICE_RESERVATION_COLLECTION || "practice_reservations",
    },
  };
}

interface TeamInfo {
  uid: string;
  username: string;
  displayName: string;
  pitSide?: string;
  pitNumber?: number | null;
}

interface TargetRecord {
  category: RecordCategory;
  categoryName: string;
  collectionName: string;
  doc: QueryDocumentSnapshot;
  id: string;
  team: TeamInfo;
  status: string;
  reservationCount?: number;
  side?: string;
  reservedAtStr: string;
}

async function findTeam(db: FirebaseFirestore.Firestore, teamIdentifier: string): Promise<TeamInfo | null> {
  // 1. usersコレクションのドキュメントID (UID) で検索
  const userDoc = await db.collection(USER_COLLECTION).doc(teamIdentifier).get();
  if (userDoc.exists) {
    const data = userDoc.data() || {};
    return {
      uid: userDoc.id,
      username: data.username || userDoc.id,
      displayName: data.display_name || data.username || "名称未設定",
      pitSide: data.pit_side,
      pitNumber: data.pit_number,
    };
  }

  // 2. username フィールドで検索
  const usernameQuery = await db
    .collection(USER_COLLECTION)
    .where("username", "==", teamIdentifier)
    .limit(1)
    .get();

  if (!usernameQuery.empty) {
    const doc = usernameQuery.docs[0];
    const data = doc.data();
    return {
      uid: doc.id,
      username: data.username || doc.id,
      displayName: data.display_name || data.username || "名称未設定",
      pitSide: data.pit_side,
      pitNumber: data.pit_number,
    };
  }

  // 3. display_name フィールドで検索
  const displayNameQuery = await db
    .collection(USER_COLLECTION)
    .where("display_name", "==", teamIdentifier)
    .limit(1)
    .get();

  if (!displayNameQuery.empty) {
    const doc = displayNameQuery.docs[0];
    const data = doc.data();
    return {
      uid: doc.id,
      username: data.username || doc.id,
      displayName: data.display_name || data.username || "名称未設定",
      pitSide: data.pit_side,
      pitNumber: data.pit_number,
    };
  }

  // 4. Firebase Auth 経由でメールアドレス検索を試みる
  try {
    const auth = getAuth();
    const email = usernameToEmail(teamIdentifier);
    const authUser = await auth.getUserByEmail(email);
    if (authUser) {
      const doc = await db.collection(USER_COLLECTION).doc(authUser.uid).get();
      const data = doc.exists ? doc.data() || {} : {};
      return {
        uid: authUser.uid,
        username: data.username || teamIdentifier,
        displayName: data.display_name || authUser.displayName || teamIdentifier,
        pitSide: data.pit_side,
        pitNumber: data.pit_number,
      };
    }
  } catch {
    // ユーザーが見つからない場合は null を返す
  }

  return null;
}

function formatDate(val: any): string {
  if (!val) return "-";
  let date: Date | null = null;
  if (val instanceof Date) {
    date = val;
  } else if (typeof val === "object" && typeof val.toDate === "function") {
    date = val.toDate();
  } else {
    date = new Date(val);
  }
  if (!date || isNaN(date.getTime())) return "-";
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function askConfirmation(queryText: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(queryText, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    });
  });
}

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║          RoTACS チーム別記録削除スクリプト (CLI)                   ║
╚═══════════════════════════════════════════════════════════════════╝

チームID（ログイン用ユーザー名 または UID）を指定して、そのチームの
テストラン記録（またはその他の記録）をFirestoreから安全に削除します。

■ 使用方法:
  npm run records:delete -- [チームID...] [オプション]
  または
  npx tsx scripts/delete-records.ts [チームID...] [オプション]

■ 引数:
  [チームID...]              削除対象のチームID（複数指定可）
                            例: team01 や Firebase UID、表示名（01_旭川 など）

■ オプション:
  --id <ID...>              チームIDを明示的に指定する場合に使用
  --type <種類>             削除対象のレコード種類を指定
                            testrun  : テストラン記録のみ (デフォルト)
                            check1   : 計量計測1記録のみ
                            check2   : 計量計測2記録のみ
                            practice : 試走場記録のみ
                            all      : 全種類の記録
  --all                     --type all と同じ（すべての記録を対象）
  --list                    削除を実行せず、現在の対象レコード一覧を表示
                            （チームID省略時は直近の記録一覧を表示）
  --dry-run                 実際の削除は行わず、対象となる記録を確認
  -y, --yes, --force        確認プロンプトをスキップして即時削除
  -h, --help                このヘルプを表示

■ 実行例:
  # 1. チーム team01 のテストラン記録を削除（対話確認あり）
  npm run records:delete -- team01
  npm run records:delete -- --id team01

  # 2. 複数チーム（team01, team02）のテストラン記録をまとめて削除
  npm run records:delete -- team01 team02

  # 3. 事前確認（ドライラン）
  npm run records:delete -- team01 --dry-run

  # 4. 指定チームの現在の記録一覧を表示
  npm run records:list -- team01

  # 5. 全チームの直近の記録一覧を表示
  npm run records:list

  # 6. チームの全記録（テストラン、計量計測1・2、試走場）をまとめて削除
  npm run records:delete -- team01 --all

  # 7. 確認なしで強制削除
  npm run records:delete -- team01 -y
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help")) {
    showHelp();
    process.exit(0);
  }

  // フラグ解析
  let isDryRun = false;
  let isForce = false;
  let isListOnly = false;
  let targetType: RecordCategory | "all" = "testrun";
  const teamIdentifiers: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--dry-run") {
      isDryRun = true;
    } else if (arg === "-y" || arg === "--yes" || arg === "--force") {
      isForce = true;
    } else if (arg === "--list") {
      isListOnly = true;
    } else if (arg === "--all") {
      targetType = "all";
    } else if (arg === "--type") {
      const nextArg = args[++i];
      if (
        nextArg === "testrun" ||
        nextArg === "check1" ||
        nextArg === "check2" ||
        nextArg === "practice" ||
        nextArg === "all"
      ) {
        targetType = nextArg;
      } else {
        console.error(`❌ 不正な --type 指定です: "${nextArg}". (指定可能: testrun, check1, check2, practice, all)`);
        process.exit(1);
      }
    } else if (arg === "--id") {
      while (i + 1 < args.length && !args[i + 1].startsWith("-")) {
        teamIdentifiers.push(args[++i]);
      }
    } else if (!arg.startsWith("-")) {
      teamIdentifiers.push(arg);
    }
  }

  // 引数なしの場合
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  initFirebase();
  const db = getFirestore();
  const allConfigs = getCollectionConfigs();
  const activeCategories: CollectionConfig[] =
    targetType === "all"
      ? [allConfigs.testrun, allConfigs.check1, allConfigs.check2, allConfigs.practice]
      : [allConfigs[targetType]];

  // チームID未指定で --list の場合は全体一覧を表示
  if (teamIdentifiers.length === 0) {
    if (isListOnly) {
      console.log("\n=======================================================");
      console.log("   RoTACS 記録一覧 (全チーム対象 / 直近最大50件)");
      console.log("=======================================================");
      console.log(`対象種別: ${targetType === "all" ? "すべての記録" : allConfigs[targetType].name}`);
      console.log("-------------------------------------------------------\n");

      let totalFound = 0;
      for (const config of activeCategories) {
        const snapshot = await db
          .collection(config.collectionName)
          .limit(50)
          .get();

        if (!snapshot.empty) {
          console.log(`【${config.name}】(${snapshot.docs.length} 件)`);
          const sortedDocs = [...snapshot.docs].sort((a, b) => {
            const timeA = a.data().reserved_at ? new Date(a.data().reserved_at.toDate ? a.data().reserved_at.toDate() : a.data().reserved_at).getTime() : 0;
            const timeB = b.data().reserved_at ? new Date(b.data().reserved_at.toDate ? b.data().reserved_at.toDate() : b.data().reserved_at).getTime() : 0;
            return timeB - timeA;
          });

          sortedDocs.forEach((doc, idx) => {
            const data = doc.data();
            const details = [
              `チーム: ${data.user_display_name || "不明"} (UID: ${data.user_id || "不明"})`,
              `ステータス: ${data.status || "不明"}`,
              data.side ? `サイド: ${data.side}` : null,
              data.reservation_count !== undefined ? `回数: ${data.reservation_count}回目` : null,
              `予約日時: ${formatDate(data.reserved_at)}`,
              `レコードID: ${doc.id}`,
            ].filter(Boolean).join(" | ");

            console.log(`  [${idx + 1}] ${details}`);
          });
          console.log("");
          totalFound += snapshot.docs.length;
        }
      }

      if (totalFound === 0) {
        console.log("現在登録されている記録はありません。");
      }
      process.exit(0);
    }

    console.error("❌ 削除対象のチームID（ユーザー名またはUID）が指定されていません。");
    console.error("例: npm run records:delete -- team01");
    console.error("ヘルプ: npm run records:delete -- --help");
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("   RoTACS チーム別記録削除ツール");
  console.log("=======================================================");
  console.log(`対象種別: ${targetType === "all" ? "すべての記録 (テストラン・計量計測1・2・試走場)" : allConfigs[targetType].name}`);
  console.log(`指定チームID: ${teamIdentifiers.join(", ")}`);
  if (isDryRun) console.log("モード: 🔍 ドライラン (実際の削除は行いません)");
  if (isListOnly) console.log("モード: 📋 一覧表示のみ");
  console.log("-------------------------------------------------------\n");

  const allTargetRecords: TargetRecord[] = [];

  for (const identifier of teamIdentifiers) {
    console.log(`🔍 チーム [${identifier}] を検索中...`);
    const team = await findTeam(db, identifier);

    if (!team) {
      console.warn(`  ⚠️  チームが見つかりませんでした: "${identifier}"`);
      continue;
    }

    console.log(`  ✓ チーム確認: [${team.username}] ${team.displayName} (UID: ${team.uid}${team.pitSide ? `, ${team.pitSide}${team.pitNumber ?? ""}番` : ""})`);

    // 各対象コレクションから該当チームの記録を検索
    for (const config of activeCategories) {
      const snapshot = await db
        .collection(config.collectionName)
        .where("user_id", "==", team.uid)
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        allTargetRecords.push({
          category: config.key,
          categoryName: config.name,
          collectionName: config.collectionName,
          doc,
          id: doc.id,
          team,
          status: data.status || "不明",
          reservationCount: data.reservation_count,
          side: data.side,
          reservedAtStr: formatDate(data.reserved_at),
        });
      }
    }
  }

  console.log("\n-------------------------------------------------------");
  console.log(`📊 該当レコード数: 合計 ${allTargetRecords.length} 件`);
  console.log("-------------------------------------------------------\n");

  if (allTargetRecords.length === 0) {
    console.log("該当する記録は見つかりませんでした。処理を終了します。");
    process.exit(0);
  }

  // 取得したレコードを一覧表示
  console.log("【対象レコード一覧】");
  allTargetRecords.forEach((rec, idx) => {
    const details = [
      `チーム: ${rec.team.displayName} (${rec.team.username})`,
      `種別: ${rec.categoryName}`,
      `ID: ${rec.id}`,
      `ステータス: ${rec.status}`,
      rec.side ? `サイド: ${rec.side}` : null,
      rec.reservationCount !== undefined ? `回数: ${rec.reservationCount}回目` : null,
      `予約日時: ${rec.reservedAtStr}`,
    ]
      .filter(Boolean)
      .join(" | ");

    console.log(`  [${idx + 1}] ${details}`);
  });
  console.log("");

  // 一覧表示モードの場合はここで終了
  if (isListOnly) {
    console.log("📋 一覧表示が完了しました。");
    process.exit(0);
  }

  // ドライランの場合はここで終了
  if (isDryRun) {
    console.log("🔍 [ドライラン完了] 上記の記録が削除対象です。実際のデータ削除は行われませんでした。");
    process.exit(0);
  }

  // 確認プロンプト
  if (!isForce) {
    const confirmed = await askConfirmation(
      `⚠️  警告: 上記 ${allTargetRecords.length} 件のレコードを Firestore から完全に削除します。\n   チームアカウント自体は保持されますが、この操作は取り消せません。\n   本当に削除を実行しますか？ (y/N): `
    );

    if (!confirmed) {
      console.log("🚫 削除処理をキャンセルしました。");
      process.exit(0);
    }
  }

  // 削除処理の実行
  console.log("\n🗑️  レコードの削除を実行中...");

  const BATCH_SIZE = 400; // Firestoreバッチの上限は500
  let deletedCount = 0;

  for (let i = 0; i < allTargetRecords.length; i += BATCH_SIZE) {
    const chunk = allTargetRecords.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const record of chunk) {
      batch.delete(record.doc.ref);
    }

    await batch.commit();
    deletedCount += chunk.length;
    console.log(`  ✓ ${deletedCount} / ${allTargetRecords.length} 件を削除完了`);
  }

  console.log("\n=======================================================");
  console.log(`🎉 削除が完了しました！ 合計 ${deletedCount} 件のレコードを削除しました。`);
  console.log("=======================================================\n");
}

main().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});
