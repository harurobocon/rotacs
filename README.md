# RoTACS (Robocon Testrun and Check Scheduler; ロタックス)

ロボコンのテストラン予約などを管理するためのWebアプリケーションです。

運用手順・チーム登録・Slack連携・参加チーム向け利用手順の詳細は、[運用・利用マニュアル (.github/USAGE_GUIDE.md)](.github/USAGE_GUIDE.md) を参照してください。

## How to Use

### Install dependencies

Use `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Validate environment variables

設定されている環境変数をチェックできます:

```bash
npm run check:env
```

## Environment Variables & Deployment

本アプリケーションに必要な環境変数の詳細は [.env.example](.env.example) を参照してください。

### Vercel Deployment

Vercelへデプロイする際は、プロジェクト設定（Project Settings -> Environment Variables）で以下の環境変数を設定してください。

1. **必須 (Client / ブラウザ公開)**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

2. **必須 (Server / 秘匿)**
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`: 改行を含む秘密鍵はそのまま貼り付けるか、`\n` でエスケープした文字列のいずれでも動作します。

3. **推奨 (Client / ブラウザ公開)**
   - `NEXT_PUBLIC_APP_DOMAIN`: 本番用ドメイン (例: `rotacs.example.com`)

4. **任意 (Slack 連携 / 秘匿)**
   - `SLACK_BOT_TOKEN`: 未設定でもビルドおよび予約・認証・管理などの全基本機能は正常に動作します。Slackへの自動通知やチャンネル管理機能を利用する場合にのみ設定してください。

## Slack Bot Configuration (Optional)

This application supports Slack Bot integration for notifications and channel management. Below is a complete app manifest that you can use to create or configure your Slack app.
※ Slack連携が未設定の場合でも、ビルドやコア機能は問題なく動作します。

### Slack App Manifest

```yaml
display_information:
  name: RoTACS Bot
  description: Robocon Testrun and Check Scheduler notification bot
  background_color: "#2c2d30"
features:
  bot_user:
    display_name: RoTACS Bot
    always_online: true
oauth_config:
  scopes:
    bot:
      - channels:manage      # Create and manage public channels
      - channels:read        # View basic information about public channels
      - channels:join        # Join public channels
      - chat:write           # Send messages as @rotacs-bot
      - chat:write.public    # Send messages to channels without joining
      - groups:read          # View basic information about private channels
      - groups:write         # Manage private channels (if needed)
settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

### Slack Environment Variable

Add the following to your `.env` or `.env.local` file (optional):

```bash
# Slack Bot Token (starts with xoxb-)
SLACK_BOT_TOKEN=xoxb-your-token-here
```

### Setting up the Slack Bot

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click "Create New App" → "From an app manifest"
3. Select your workspace
4. Paste the YAML manifest above
5. Review permissions and create the app
6. Install the app to your workspace
7. Copy the "Bot User OAuth Token" from the OAuth & Permissions page
8. Add the token to your `.env` file as `SLACK_BOT_TOKEN`

### Channel Naming Convention

The bot creates channels with the following naming pattern:
- Format: `{team_number:02d}_{display_name}`
- Example: `01_旭川`, `02_函館`, `13_富山本郷`

This allows searching for channels by display name (e.g., searching for "旭川" will find the channel "01_旭川").

## License

Licensed under the [MIT license](https://github.com/FlechaMaker/rotacs/blob/main/LICENSE).

