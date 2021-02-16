// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const fs = require("fs")
const path = require("path")

module.exports = (on, config) => {
  on("task", {
    fixture(fixtures) {
      const result = {}

      function importFile(fixture) {
        return fs.readFileSync(
          path.join(__dirname, "..", "fixtures", fixture),
          { encoding: "binary" },
        )
      }

      if (Array.isArray(fixtures)) {
        fixtures.forEach((fixture) => {
          result[fixture] = importFile(fixture)
        })
      } else {
        result[fixtures] = importFile(fixtures)
      }

      return result
    },
  })

  return config
}
