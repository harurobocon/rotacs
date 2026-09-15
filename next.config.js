/** @type {import('next').NextConfig} */

// ビルド時・起動時の環境変数検証 (SKIP_ENV_VALIDATION=1 または true でスキップ可能)
if (
  process.env.SKIP_ENV_VALIDATION !== "1" &&
  process.env.SKIP_ENV_VALIDATION !== "true"
) {
  const requiredClientKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const missingClient = requiredClientKeys.filter((key) => {
    const val = process.env[key];
    return !val || !val.trim();
  });

  if (missingClient.length > 0) {
    console.error(
      "\n❌ [Next.js Build] 必須のクライアント環境変数が設定されていません:",
    );
    missingClient.forEach((k) => console.error(`   - ${k}`));
    console.error("\n.env.example を参考に、環境変数を設定してください。");
    console.error(
      "CIやテスト等で検証をスキップする場合は SKIP_ENV_VALIDATION=1 を指定してください。\n",
    );
    throw new Error(
      `Missing required environment variables: ${missingClient.join(", ")}`,
    );
  }

  // Slackのチェック（未設定でもビルドは継続）
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_BOT_TOKEN.trim()) {
    console.info(
      "ℹ️  [Next.js Build] SLACK_BOT_TOKEN が未設定です。Slack通知機能は無効化された状態でビルドされます。",
    );
  }
}

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@node-rs/argon2", "csv"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value:
              "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache, max-image-preview:none, max-snippet:-1, max-video-preview:-1",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
