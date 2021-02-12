//@ts-check

// I guess this should be a plugin but it's Friday and I'm tired.

function interceptPyodide(cy) {
  cy.intercept(
    "GET",
    "https://download.mooc.fi/pyodide-cdn/v0.16.1/packages.json",
    { fixture: "pyodide/packages.json" },
  )
  cy.intercept(
    "GET",
    /^https:\/\/download\.mooc\.fi\/pyodide-cdn\/v0\.16\.1\/pyodide\.asm\.wasm$/,
    { fixture: "pyodide/pyodide.asm.wasm" },
  )
  cy.intercept(
    "GET",
    /^https:\/\/download\.mooc\.fi\/pyodide-cdn\/v0\.16\.1\/pyodide\.asm\.data$/,
    { fixture: "pyodide/pyodide.asm.data" },
  )
  cy.task("fixture", [
    "pyodide/pyodide.asm.data.js",
    "pyodide/pyodide.asm.js",
    "pyodide/pyodide.js",
  ]).then((f) => {
    cy.intercept(
      "GET",
      /https:\/\/download.mooc\.fi\/pyodide-cdn\/v0\.16\.1\/pyodide\.asm\.data\.js$/,
      {
        headers: { "Content-Type": "application/x-javascript" },
        body: f["pyodide/pyodide.asm.data.js"],
      },
    )
    cy.intercept(
      "GET",
      "https://download.mooc.fi/pyodide-cdn/v0.16.1/pyodide.asm.js",
      {
        headers: { "Content-Type": "application/x-javascript" },
        body: f["pyodide/pyodide.asm.js"],
      },
    )
    cy.intercept(
      "GET",
      "https://download.mooc.fi/pyodide-cdn/v0.16.1/pyodide.js",
      {
        headers: { "Content-Type": "application/x-javascript" },
        body: f["pyodide/pyodide.js"],
      },
    )
  })
}

module.exports = {
  interceptPyodide,
}
