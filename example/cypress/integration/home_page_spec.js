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

  it("has a load quiz button", () => {
    cy.get("[data-cy=load-btn]").click()
  })

  it("has an unload quiz button", () => {
    cy.get("[data-cy=unload-btn]").click()
  })

  it("has a print editor content button", () => {
    cy.get("[data-cy=print-btn]").click()
  })

  it("has a run code button", () => {
    cy.get("[data-cy=run-btn]").click()
  })

  it("has an editor input field", () => {
    cy.visit("/")
    cy.get(".monaco-editor")
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type('# A simple program\nprint("hello from", "python")\n')
  })

  it("running python code produces output", () => {
    cy.get("[data-cy=run-btn]").click()
    cy.contains("hello from python")
  })

  it("close button hides output", () => {
    cy.get("[data-cy=close-btn").click()
    cy.contains("hello from python").should("not.exist")
  })
})
