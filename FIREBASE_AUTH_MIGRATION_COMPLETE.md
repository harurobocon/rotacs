# Firebase Authentication移行完了レポート

## 概要

LuciaとPostgreSQLベースの認証システムから、Firebase Authenticationへの移行が完了しました。さらに、システムのアーキテクチャを**クライアントサイド書き込みとサーバーサイド通知フック**の形（Option B）へとリファクタリングしました。

## 実施した変更

### 1. Firebase基盤の構築

- ✅ `lib/firebase/clientApp.ts` - Firebase Authentication初期化
- ✅ `lib/firebase/serverApp.ts` - Firebase Admin Auth SDK追加
- ✅ `firestore.rules` - セキュリティルールファイル作成・更新（クライアント書き込みの保護）

### 2. クライアント側認証と書き込み処理

- ✅ `lib/contexts/AuthContext.tsx` - 認証状態管理Context作成
- ✅ `app/login/page.tsx`, `app/logout/page.tsx` - Firebase Auth APIでのログイン・ログアウト実装
- ✅ `hooks/useIsAdmin.ts` - Custom Claims対応
- ✅ `app/testrun/new/page.tsx`, `app/check1/new/page.tsx`, `app/check2/new/page.tsx`, `app/practice/new/page.tsx` - 予約フォームを、Server Actions（レガシー）から**Firebase Client SDKを用いた直接Firestore書き込み**へとリファクタリング

### 3. サーバー側ロジックの簡素化・通知フック化

- ✅ `lib/server/testrun.ts`, `lib/server/check.ts`, `lib/server/practice.ts` - Kysely/PostgreSQLによるDB書き込み処理を排除し、クライアントからの書き込み完了後に呼ばれる「Slack通知トリガー（フック）」として再実装
- ✅ `middleware.ts` - 認証チェックの責務をアプリケーション層へ移譲
- ✅ `lib/server/firestoreUserHelpers.ts` - Firestoreユーザー取得ヘルパー

### 4. 削除・廃止されたアーキテクチャ

**削除されたファイル・依存関係:**
- `lib/server/lucia.ts`, `lib/server/db.ts`
- `migrations/`, `types/db.ts`, 各種マイグレーションスクリプト
- lucia, @lucia-auth/adapter-postgresql, pg, kysely, @vercel/postgres-kysely, @node-rs/argon2

**非推奨となったパターン:**
- サーバー側での`validateRequest()`の呼び出し（認証はすべてクライアントまたはFirestoreルールで担保）

## アーキテクチャ変更（Option B）

### Before (Lucia + PostgreSQL)
```
Client [データ送信] → Server Action (validateRequestによる認証＋業務ロジックバリデーション) → PostgreSQL (データ保存)
```

### After (Firebase Auth + Client-side Writes)
```
1. 認証・認可とデータ書き込み
Client [データ作成/更新] → Firebase Auth (認証トークン)
                      ↓
              Firestore (Client SDK)
                      ↓
            Firestore Security Rules (認可と基本改ざん防止ルール)

2. 副作用（通知等）の実行
Client [Firestoreへの書き込み完了]
          ↓
     (予約IDなどを送信)
          ↓
Server Action [Notification Hook]
          ↓
  Firebase Admin SDK (Firestoreから最新データを読み取り)
          ↓
   Slack等の外部サービスへ通知完了後、通知済みフラグ等の更新
```

## セキュリティモデル

- **認証**: Firebase Authentication（クライアント側）
- **認可・データ保護**: Firestore Security Rules（サーバー側における最前線の防御）
- **管理者判定**: Firebase Custom Claims (`admin: true`) または Firestore `users` コレクションの `role` フィールド

### Firestore Security Rules

`firestore.rules`で適用している主要なルール：

- **ユーザーコレクション**: 自分のドキュメントのみ読み書き可能。管理者は全操作可能。
- **予約データ（check1, check2, practice, testrun）**: 
  - 全認証済みユーザーが読み取り可能
  - 自分のID(`user_id == request.auth.uid`)を使用した新規予約レコードの作成が可能（他人のIDを騙った作成の防止）
  - クライアント側で業務要件としてのバリデーション（重複予約の防止など）を実施し、万が一の悪意あるリクエストによる全データ破壊などはルール側で防御。
- **設定データ**: 認証済みユーザー全体が読み取り可能、管理者のみ書き込み可能。

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

Firebase Admin SDKを使用してカスタムクレーム(`admin: true`)を付与し、さらにFirestoreの`users`コレクションに対応するドキュメントを作成します。

### 4. 環境変数の確認

`.env.local`に以下の変数が設定されていることを確認してください。

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

# 予約コレクション名群
NEXT_PUBLIC_USER_COLLECTION=users
NEXT_PUBLIC_CHECK1_RESERVATION_COLLECTION=check1
NEXT_PUBLIC_CHECK2_RESERVATION_COLLECTION=check2
```

## 開発と拡張におけるガイダンス

### 新しい書き込み処理の実装
新しく予約や変更操作を追加する場合、Server Actionにデータを丸投げして保存させるのではなく、以下のフローを遵守してください。

1. **Client Component内**で `runTransaction` や `addDoc`, `updateDoc` 等の Firebase Client SDK を使って Firestore へ書き込む。
2. 書き込みのセキュリティ・所有者チェックは **Firestore Security Rules** に任せる（または追加する）。
3. Slackなどの外部通知や、Serverでのみ実行可能な処理が必要な場合は、ClientでのFirestore書き込み**完了後**に、該当するIDを渡して **サーバ側の通知用フック関数** をトリガーする。
4. 通知用フック関数の内部では、**サーバーのAdmin権限**を使ってFirestoreから最新情報を読み直して通知処理を行う。クライアントから送られた文字列などをそのまま信用して通知本文に入れないこと。

### 新規ユーザーの作成

管理者画面（`/settings/users`）から：

1. CSV形式でユーザー情報を入力
2. フォーマット: `username,password,display_name,role,pit_side,pit_number`
3. 例: `01_asahikawa,password123,旭川,user,A,1`
（内部的に `{username}@rotacs.yuchi.jp` のメールアドレスに変換されます）

---

**移行完了日**: 2024年3月
**移行アーキテクチャ**: クライアントサイド書き込み対応版（Option B）
