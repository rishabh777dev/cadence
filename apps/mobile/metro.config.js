// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

let config;
try {
  const { getSentryExpoConfig } = require("@sentry/react-native/metro");
  config = getSentryExpoConfig(__dirname, {
    annotateReactComponents: true,
    includeWebReplay: false,
    includeWebFeedback: false,
  });
} catch {
  config = getDefaultConfig(__dirname);
}

module.exports = config;
