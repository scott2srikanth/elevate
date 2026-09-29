const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expo,
  {
    ignores: ["public/observation/vendor/**", "dist/**", "dist-android/**", ".wrangler/**", "test-results/**"],
  },
]);
