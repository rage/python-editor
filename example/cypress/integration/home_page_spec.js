describe("The Main Page", () => {
  it("successfully loads", () => {
    cy.visit("/")
  })

  it("has a url input field", () => {
    const inputUrl = "http://www.foo.bar"
    cy.get("[data-cy=url-input]").type(inputUrl, { delay: 10 })
  })

  it("has a user token input field", () => {
    const inputToken = "abc123"
    cy.get("[data-cy=token-input]").type(inputToken, { delay: 10 })
  })
})
