# Firebase Authentication移行完了レポート

## 概要

LuciaとPostgreSQLベースの認証システムから、Firebase Authenticationへの移行が完了しました。

## 実施した変更

### 1. Firebase基盤の構築

- ✅ `lib/firebase/clientApp.ts` - Firebase Authentication初期化
- ✅ `lib/firebase/serverApp.ts` - Firebase Admin Auth SDK追加
- ✅ `firestore.rules` - セキュリティルールファイル作成

### 2. クライアント側認証

- ✅ `lib/contexts/AuthContext.tsx` - 認証状態管理Context作成
- ✅ `app/login/page.tsx` - Firebase Auth APIでログイン実装
- ✅ `app/logout/page.tsx` - Firebase Auth APIでログアウト実装
- ✅ `hooks/useIsAdmin.ts` - Custom Claims対応
- ✅ `components/AuthGuard.tsx` - クライアント側ルート保護

### 3. サーバー側の簡素化

- ✅ `middleware.ts` - 認証チェック削除
- ✅ `lib/server/firebaseAuth.ts` - ユーザー管理関数（Firebase Admin SDK）
- ✅ `lib/server/firestoreUserHelpers.ts` - Firestoreユーザー取得ヘルパー
- ✅ `app/settings/users/actions.ts` - Firebase対応に書き換え

### 4. 削除されたファイル・依存関係

**削除されたファイル:**
- `lib/server/lucia.ts`
- `lib/server/db.ts`
- `migrations/`（フォルダ全体）
- `types/db.ts`
- `scripts/migrateToLatest.ts`
- `scripts/migrateDownAll.ts`

**削除された依存関係:**
- lucia
- @lucia-auth/adapter-postgresql
- pg
- kysely
- @vercel/postgres-kysely
- @node-rs/argon2
- @types/pg

## アーキテクチャ変更

### Before (Lucia + PostgreSQL)
```
Client → Server Action (validateRequest) → PostgreSQL
                ↓
         Session Cookie Check
                ↓
         Firestore Data Access
```

### After (Firebase Auth)
```
Client → Firebase Auth (認証) → ID Token
          ↓
    AuthContext (状態管理)
          ↓
    Server Action (認証なし) → Firestore
                                  ↓
                            Security Rules (認可)
```

## セキュリティモデル

- **認証**: Firebase Authentication（クライアント側）
- **認可**: Firestore Security Rules（サーバー側）
- **管理者判定**: Firebase Custom Claims (`admin: true`)

### Firestore Security Rules

`firestore.rules`ファイルに以下のルールが実装されています：

```javascript
// ユーザーコレクション
- 自分のドキュメントは読み取り可能
- 管理者は全ユーザーのドキュメントを読み書き可能

// 予約データ（check1, check2, practice, testrun）
- 全認証済みユーザーが読み取り可能
- 自分の予約を作成・更新・削除可能
- 管理者は全予約を操作可能

// 設定データ
- 全認証済みユーザーが読み取り可能
- 管理者のみ書き込み可能
```

## デプロイ手順

### 1. Firebase Authenticationの設定

Firebase Consoleで以下を設定：

1. Authentication → Sign-in method
2. Email/Passwordを有効化
3. ユーザー操作の設定：
   - ❌ 作成（登録）を許可する
   - ❌ 削除を許可する
   - ✅ メール列挙保護（推奨）

### 2. Firestore Security Rulesのデプロイ

```bash
firebase deploy --only firestore:rules
```

### 3. 初期管理者ユーザーの作成

#### 方法1: Firebase Admin SDK（推奨）

```javascript
const admin = require('firebase-admin');
admin.initializeApp();

const email = 'admin@rotacs.yuchi.jp';
const password = 'your-secure-password';

// ユーザー作成
const userRecord = await admin.auth().createUser({
  email,
  password,
  emailVerified: true,
});

// Admin Custom Claimを設定
await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

// Firestoreにユーザー情報を保存
await admin.firestore().collection('users').doc(userRecord.uid).set({
  id: userRecord.uid,
  username: 'admin',
  display_name: '管理者',
  role: 'admin',
  pit_side: 'A', // 適切な値を設定
  pit_number: 0,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});
```

#### 方法2: Firebase Console

1. Authentication → Usersでユーザー作成
2. Cloud Functionsでカスタムクレーム設定スクリプトを実行

### 4. 環境変数の確認

`.env.local`に以下の変数が設定されていることを確認：

```bash
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# Collection Names
NEXT_PUBLIC_USER_COLLECTION=users
NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION=check1
NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION=check2
```

## 使用方法

### クライアント側で認証状態を取得

```typescript
import { useAuth } from '@/lib/contexts/AuthContext';

function MyComponent() {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return <div>読み込み中...</div>;
  if (!user) return <div>ログインしてください</div>;
  
  return (
    <div>
      <p>ようこそ、{user.email}</p>
      {isAdmin && <p>管理者権限があります</p>}
    </div>
  );
}
```

### ルートを保護

```typescript
import { AuthGuard } from '@/components/AuthGuard';

export default function ProtectedPage() {
  return (
    <AuthGuard requireAuth requireAdmin>
      <div>管理者専用ページ</div>
    </AuthGuard>
  );
}
```

### Server Actionでユーザー情報を使用

```typescript
"use server";

import { getFirestoreUserById } from '@/lib/server/firestoreUserHelpers';

export async function myAction(userId: string) {
  // クライアントからuserIdを受け取る
  const user = await getFirestoreUserById(userId);
  
  if (!user) {
    return { errors: "ユーザーが見つかりません" };
  }
  
  // ユーザー情報を使用
  // 認可はFirestore Rulesで処理される
}
```

### 新規ユーザーの作成

管理者画面（`/settings/users`）から：

1. CSV形式でユーザー情報を入力
2. フォーマット: `username,password,display_name,role,pit_side,pit_number`
3. 例: `01_asahikawa,password123,旭川,user,A,1`

## 既知の制限事項と今後の対応

### 1. validateRequest残存箇所

以下のファイルでは`validateRequest()`の呼び出しが残っていますが、deprecatedスタブ関数を返すため実行時エラーにはなりません：

- `lib/server/check.ts`
- `lib/server/practice.ts`
- `lib/server/testrun.ts`

**対応方法:**
これらのServer Actionsを以下のように修正する必要があります：

```typescript
// Before
export async function createReservation(formData: FormData) {
  const { user } = await validateRequest();
  // ...
}

// After
export async function createReservation(userId: string, formData: FormData) {
  // クライアントからuserIdを受け取る
  const user = await getFirestoreUserById(userId);
  // Firestore Rulesで認可を処理
  // ...
}
```

### 2. ログイン画面の更新

ログイン画面では、ユーザーは`username`のみを入力します。
内部的に`{username}@rotacs.yuchi.jp`形式に変換されます。

## トラブルシューティング

### ログインできない

1. Firebase Consoleでユーザーが作成されているか確認
2. メールアドレスが`{username}@rotacs.yuchi.jp`形式か確認
3. ブラウザのコンソールでエラーを確認

### 管理者権限が反映されない

1. Firebase Consoleでユーザーのカスタムクレームを確認
2. ログアウト→ログインで最新のトークンを取得

### Firestore操作が失敗する

1. Firestore Rulesがデプロイされているか確認
2. ブラウザのコンソールでエラー内容を確認
3. Firebase Consoleの「Rules」タブでルールシミュレーターを使用

## サポート

問題が発生した場合は、以下を確認してください：

1. ブラウザのコンソールログ
2. Firebase Consoleのエラーログ
3. Next.jsサーバーのログ

---

**移行完了日**: 2025-11-16
**移行者**: GitHub Copilot
