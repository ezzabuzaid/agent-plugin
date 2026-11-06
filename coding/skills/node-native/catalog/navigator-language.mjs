// The user's locale, as the runtime's default locale (from LANG and LC_* on POSIX).
export default {
  apis: ['globals:navigator', 'js:Navigator.prototype.language', 'js:Navigator.prototype.languages'],
  reviewedAt: 'v26.13.0',
  replaces: {
    'os-locale@8.0.0': {
      default: {
        native: () => navigator.language,
        package: ({ default: osLocale }) => osLocale(),
      },
    },
  },
};
