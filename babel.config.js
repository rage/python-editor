// eslint-disable-next-line no-undef
module.exports = {
  presets: [
    ["@babel/preset-react", { runtime: "automatic" }],
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
}
