describe("The Main Page", () => {
  it("successfully loads", () => {
    cy.visit("/")
  })

  it("has a url input field", () => {
    const inputUrl = "http://www.foo.bar"
    cy.get("[data-cy=url-input]")
      .find("input")
      .type(inputUrl)
      .should("have.value", inputUrl)
  })

  it("has a user token input field", () => {
    const inputToken = "123abc000"
    cy.get("[data-cy=token-input]")
      .find("input")
      .type(inputToken)
      .should("have.value", inputToken)
  })
})
