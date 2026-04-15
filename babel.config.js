module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // We don't use any reanimated features yet, so skip the plugin to
          // avoid requiring react-native-worklets at build time.
          reanimated: false,
        },
      ],
      'nativewind/babel',
    ],
  };
};
