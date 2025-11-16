# Luciaによる認証からFirebase Authenticationへの移行計画

## Firebase Authenticationでの認証方式
- メールアドレスとパスワードによる認証のみ
- ユーザー登録はadminのみ可能．現状のユーザー登録UIを使用する．バックエンドを編集してfirebase-admin SDKを使用してユーザー登録を行う
    - firebase authでの設定は以下の通り
        ユーザー アクション
        ユーザーが自身のアカウントで次のアクションを行うのを許可または禁止します。これらのアクションは、Admin SDK を使用していつでも行うことができます。詳細


        ❌ 作成（登録）を許可する
        ❌ 削除を許可する
        ○ メール列挙保護（推奨）
- 登録uiでのidは id@rotacs.yuchi.jp の形式に変換して登録する

## 実装上の考慮点
- 現状はバックエンドでLuciaを使っているが，firebase authはフロントエンドで認証を行う必要がある．サーバー・クライアント境界に注意すること．
- サーバーサイドでは認証を使用しないようにすること．するとコードがややこしくなるので．その代わりに，firestoreのrulesで認証を確認すること．firestoreのrulesは生成してファイルに保存しておくこと．ユーザーがアップロードします．
- 現状のコードベースを徹底的に調査して，認証に関わるコードを洗い出すこと．
- アプリケーションは完全に初期化するかとができるため，破壊的な変更も気にせずにリニューアルすること．
- この変更はpostgresを廃止して，完全にサーバレスの構成にしたいために行います．なので，postgresに依存する部分は完全に削除してください．ユーザーの情報は現状のコードでもfirestoreで管理しているので，それを参照しましょう．



## 詳細な質問事項と回答:

LuciaからFirebase Authenticationへの移行に向けて、コードベースの調査を開始します。 

認証関連コード調査

正規表現 `lucia|Lucia` を検索し、結果は 20 件でした

正規表現 `postgres|PostgreSQL|pg|Postgres` を検索し、結果は 20 件でした

正規表現 `validateRequest|session` を検索し、結果は 20 件でした

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/package.json) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/auth.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/lucia.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/db.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/middleware.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/app/login/page.tsx) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/app/logout/page.tsx) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/firebase) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/firestoreUser.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/converters.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/types/user.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/types/auth.ts) の読み取り

正規表現 `validateRequest` を検索し、結果は 32 件でした

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/firebase/clientApp.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/firebase/serverApp.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/firebase/firestore.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/app/settings/users/actions.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/settings.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/app/settings/users) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/migrations) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/migrations/001_init.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/migrations/002_add_slack_channel_id.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/types/db.ts) の読み取り

正規表現 `db\.|from\(\"user\"|from\(\"session\"|insertInto\(\"user\"|insertInto\(\"session\"` を検索し、結果は 33 件でした

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/client/auth.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/hooks/useIsAdmin.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/app/layout.tsx) の読み取り

`**/*.env*` に一致するファイルを検索しました。一致するものはありません

"environment variables POSTGRES LUCIA session cookie"、24 結果の コードベース を検索しました

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/adminCheck.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/app/api) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/server/reservation.ts) の読み取り

[](file:///Users/yuchi/workspace/harurobo/git/rotacs/lib/firebase/clientConfig.ts) の読み取り

正規表現 `lucia\.sessionCookieName|LUCIA_SESSION_COOKIE_NAME|SESSION_COOKIE_ROLE_NAME` を検索し、結果は 12 件でした

## Plan: LuciaからFirebase Authenticationへの移行

LuciaとPostgreSQLによるバックエンド認証を、Firebase Authenticationによるフロントエンド認証に完全移行します。これにより、PostgreSQL依存を完全に排除し、サーバーレス構成を実現します。ユーザーデータはFirestoreで一元管理し、Firestore Rulesで認可を制御します。

### Steps

1. **Firebase Authentication初期化とFirestore Rules作成** — clientApp.tsでAuth初期化、Firestore Rulesファイルを生成してユーザー・予約データの認証/認可ルールを定義

2. **クライアント認証ロジック実装** — app/login/page.tsxとapp/logout/page.tsxをFirebase Auth APIで書き換え、ログイン/ログアウトをクライアント側で処理

3. **ミドルウェアとサーバー認証の削除** — middleware.tsを簡素化または削除、全サーバーアクション(32箇所)から`validateRequest`呼び出しを削除し、Firestore操作に変更

4. **ユーザー管理機能の書き換え** — settings.tsの`createUser`/`deleteUser`をFirebase Admin SDKで実装、app/settings/users/page.tsxをFirestoreベースに変更

5. **PostgreSQL/Lucia依存の完全削除** — lib/server/auth.tsとlib/db.tsを削除、migrationsフォルダ削除、package.jsonから関連パッケージ削除、型定義を整理

6. **クライアント側権限チェックとUI調整** — useIsAdmin.tsをFirebase Authユーザー情報ベースに変更、Lucia型を使用する全コンポーネントを更新

### Further Considerations

1. **Firestore Rulesの設計方針** — ユーザー情報はuid一致チェック、予約データは作成者・管理者チェック、管理者判定はFirestoreの`users/{uid}`ドキュメントの`role`フィールドで実施？
2. **既存ユーザーのマイグレーション** — PostgreSQLの既存ユーザーをFirebase Authにインポートする必要がある？パスワード再設定が必要？それとも完全初期化で問題ない？
3. **メールアドレス形式の一貫性** — 登録UIで`{id}@rotacs.yuchi.jp`形式に変換する処理は、クライアント側・サーバー側どちらで実装？バリデーションルールは？

### 質問への回答
1. admin判定はcustom claimを使えませんかね？ https://firebase.google.com/docs/auth/admin/custom-claims?hl=ja
2. 完全初期化で問題ない
3. お任せします．


## 確定した移行計画

以下の方針で実装します:

### **主要な決定事項**

1. **Admin判定**: Firebase Authentication の **Custom Claims** を使用
   - `admin: true` のカスタムクレームを設定
   - クライアント側: `getIdTokenResult()` でクレーム取得
   - サーバー側: `verifyIdToken()` 後のトークンからクレーム確認

2. **既存データ**: 完全初期化前提
   - PostgreSQLの既存ユーザーは移行不要
   - Firebase Authで新規ユーザー作成から開始

3. **メール形式**: `{username}@rotacs.yuchi.jp`
   - クライアント側のヘルパー関数で変換処理を実装
   - ユーザーはusernameのみ入力、内部で自動変換

### **アーキテクチャ変更**

#### Before (Lucia + PostgreSQL)
```
Client → Server Action (validateRequest) → PostgreSQL Session Check
                                          → PostgreSQL User Query
                                          → Firestore Data
```

#### After (Firebase Auth)
```
Client → Firebase Auth (認証) → Firestore (データ + Rules)
      ↓
      Context Provider (User + Admin状態)
      ↓  
      Server Action (認証不要) → Firestore Rules が認可制御
```

### **セキュリティモデル**

- **認証**: Firebase Authentication (フロントエンド)
- **認可**: Firestore Rules (バックエンド)
  - ユーザードキュメント: `request.auth.uid == userId`
  - 予約データ: `request.auth.uid == resource.data.user_id || request.auth.token.admin == true`
  - 管理者設定: `request.auth.token.admin == true`

### **実装の22ステップ**

上記のTODOリストの通り、段階的に実装します。主なマイルストーン:

1. **Phase 1 (Steps 1-3)**: Firebase基盤整備
2. **Phase 2 (Steps 4-7)**: 認証UI・状態管理の書き換え
3. **Phase 3 (Steps 8-14)**: サーバーサイドコードの移行
4. **Phase 4 (Steps 15-21)**: クリーンアップ
5. **Phase 5 (Step 22)**: テスト・検証

実装を開始しますか?