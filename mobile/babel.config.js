module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      // Returns { plugins: [...] } — must be a preset, not a plugin
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
