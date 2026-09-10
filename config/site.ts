export type SiteConfig = typeof siteConfig;

type Route = Record<string, any>;

export const routes: Route = {
  label: "ホーム",
  href: "/",
  home: {
    label: "ホーム",
    href: "/",
  },
  testrun: {
    label: "テストラン一覧",
    href: "/testrun",
    new: {
      label: "テストラン予約",
      href: "/testrun/new",
    },
  },
  check1: {
    label: "計量計測1",
    href: "/check1",
    new: {
      label: "計量計測1予約",
      href: "/check1/new",
    },
    "status-table": {
      label: "計量計測1結果一覧表",
      href: "/check1/status-table",
    },
  },
  check2: {
    label: "計量計測2",
    href: "/check2",
    new: {
      label: "計量計測2予約",
      href: "/check2/new",
    },
    "status-table": {
      label: "計量計測2結果一覧表",
      href: "/check2/status-table",
    },
  },
  practice: {
    label: "試走場",
    href: "/practice",
    new: {
      label: "試走場予約",
      href: "/practice/new",
    },
  },
  settings: {
    label: "設定",
    href: "/settings",
    notification: {
      label: "通知",
      href: "/settings/notification",
    },
    users: {
      label: "ユーザー",
      href: "/settings/users",
    },
    "check-mode": {
      label: "計量計測設定",
      href: "/settings/check-mode",
    },
    reservations: {
      label: "予約設定",
      href: "/settings/reservations",
      control: {
        label: "予約受付設定",
        href: "/settings/reservations/control",
      },
    },
    display: {
      label: "表示設定",
      href: "/settings/display",
    },
  },
  display: {
    label: "待機場モニター",
    href: "/display/waiting",
    waiting: {
      label: "待機場モニター",
      href: "/display/waiting",
    },
    check1: {
      label: "待機場モニター（前日）",
      href: "/display/waiting/check1",
    },
    check2: {
      label: "待機場モニター（当日）",
      href: "/display/waiting/check2",
    },
  },
  login: {
    label: "ログイン",
    href: "/login",
  },
  logout: {
    label: "ログアウト",
    href: "/logout",
  },
};

export const siteConfig = {
  name: "RoTACS",
  description: "Robocon Testrun And Check Scheduler",
  tabItems: [
    routes.home,
    routes.testrun,
    routes.check1,
    routes.check2,
    // routes.practice,
    routes.settings,
  ],
  navMenuItemsSignedOut: [routes.home, routes.display, routes.login],
  navMenuItemsSignedIn: [
    routes.home,
    routes.testrun,
    routes.check1,
    routes.check2,
    routes.display,
    // routes.practice,
    routes.settings,
    routes.logout,
  ],
  userMenuItems: [routes.settings, routes.logout],
  settingTabItems: [routes.settings.notification],
  adminSettingTabItems: [
    routes.settings.notification,
    routes.settings.users,
    routes.settings["check-mode"],
    routes.settings.reservations.control,
    routes.settings.display,
  ],
  links: {
    github: "https://github.com/nextui-org/nextui",
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui.org",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
