# RoTACS (Robocon Testrun and Check Scheduler; ロタックス)

ロボコンのテストラン予約などを管理するためのWebアプリケーションです。

## How to Use

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`, Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@nextui-org/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## Slack Bot Configuration

This application requires a Slack Bot with specific permissions to manage notifications and channels. Below is a complete app manifest that you can use to create or configure your Slack app.

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

### Required Environment Variables

Add the following to your `.env` file:

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

