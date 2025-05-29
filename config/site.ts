export type SiteConfig = typeof siteConfig;

type Route = Record<string, any>;

export const routes: Route = {
  label: "ホーム",
  href: "/",
  home: {
    label: "ホーム",
    href: "/",
  },
  about: {
    label: "About",
    href: "/about",
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
  },
  check2: {
    label: "計量計測2",
    href: "/check2",
    new: {
      label: "計量計測2予約",
      href: "/check2/new",
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
    routes.practice,
    routes.settings,
  ],
  navMenuItemsSignedOut: [routes.home, routes.login],
  navMenuItemsSignedIn: [
    routes.home,
    routes.about,
    routes.settings,
    routes.logout,
  ],
  userMenuItems: [routes.settings, routes.logout],
  settingTabItems: [routes.settings.notification],
  adminSettingTabItems: [routes.settings.notification, routes.settings.users],
  links: {
    github: "https://github.com/nextui-org/nextui",
    twitter: "https://twitter.com/getnextui",
    docs: "https://nextui.org",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
