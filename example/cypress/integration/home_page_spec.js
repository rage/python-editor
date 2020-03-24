const program = '# A simple program\nprint("hello from", "python")\n'
const inputUrl = "http://www.foo.bar"
const inputToken = "123abc000"

describe("The Playground", () => {
  describe("The main page", () => {
    it("successfully loads", () => {
      cy.visit("/")
    })

    it("has a url input field", () => {
      cy.get("[data-cy=url-input]")
        .find("input")
        .type(inputUrl)
        .should("have.value", inputUrl)
    })

    it("can get url from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("url", inputUrl)
      cy.get("[data-cy=url-input]")
        .find("input")
        .should("have.value", inputUrl)
    })

    it("has a user token input field", () => {
      cy.get("[data-cy=token-input]")
        .find("input")
        .type(inputToken)
        .should("have.value", inputToken)
    })

    it("can get token from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("token", inputToken)
      cy.get("[data-cy=token-input]")
        .find("input")
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

    it("has a run code with wrapped imports button", () => {
      cy.get("[data-cy=run-wrapped-btn]").click()
    })

    it("has an editor input field", () => {
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(program)
    })

    it("editor contents can be displayed as an alert", () => {
      const stub = cy.stub()
      cy.on("window:alert", stub)
      cy.get("[data-cy=print-btn]")
        .click()
        .then(() => {
          expect(stub.getCall(0)).to.be.calledWith(program)
        })
    })

    it("Running python code produces output", () => {
      cy.get("[data-cy=run-btn]").click()
      cy.contains("hello from python")
    })

    it("close button hides output", () => {
      cy.get("[data-cy=close-btn").click()
      cy.contains("hello from python").should("not.exist")
    })
  })

  describe("Running python code that includes input command", () => {
    const inputProgram = 'input("Enter a word:")'

    it("displays input prompt", () => {
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(inputProgram)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=output-container]").contains("Enter a word:")
    })

    it("displays waiting indication in title", () => {
      cy.contains("Waiting for input")
    })

    it("displays input field with label", () => {
      cy.get("[data-cy=user-input-field]").contains(
        "Enter input and press 'Enter'",
      )
    })

    it("can enter input value and add it to output", () => {
      cy.get("[data-cy=user-input-field]")
        .find("input")
        .type("cat")
        .type("{enter}")
      cy.contains("cat")
    })

    it("hides input field and changes title after entering input", () => {
      cy.get("[data-cy=user-input-field]").should("not.exist")
      cy.contains("Waiting for input").should("not.exist")
    })

    it("stops program if stop button is clicked", () => {
      const inputProgram = 'input("Enter a word:")'
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(inputProgram)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=stop-btn]").click()
      cy.get("[data-cy=stop-btn]").should("be.disabled")
      cy.get("[data-cy=user-input-field]").should("not.exist")
    })

    it("displays running status when program is running", () => {
      const infiniteProgram = "while True:\n  x = 0"
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(infiniteProgram)
      cy.get("[data-cy=run-btn]").click()
      cy.contains("Running")
      cy.get("[data-cy=ouput-title-stop-btn]").should("not.be.disabled")
    })

    it("clicking stop button in output title stops program", () => {
      const inputProgram = 'input("Enter a word:")'
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(inputProgram)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=output-title-stop-btn").click()
      cy.get("[data-cy=output-title-stop-btn]").should("be.disabled")
      cy.get("[data-cy=user-input-field]").should("not.exist")
    })
  })

  describe.only("Using default files", () => {
    it("Unloading quiz brings up default main.py file", () => {
      cy.visit("/")
      cy.get("[data-cy=unload-btn]").click()
      cy.contains("main.py")
    })

    it("main.py contents are displayed", () => {
      cy.contains("# No quiz has been loaded")
    })

    it("test.py can be selected and displayed", () => {
      cy.get("[data-cy=select-file]")
        .find("select")
        .select("test.py")
      cy.contains("# This is the default file test.py")
    })

    it("edits to source files persist", () => {
      const testString = "Romanes eunt domus"
      cy.get("[data-cy=select-file]")
        .find("select")
        .select("main.py")
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(testString)
      cy.get("[data-cy=select-file]")
        .find("select")
        .select("test.py")
      cy.contains("This is the default file test.py")
      cy.get("[data-cy=select-file]")
        .find("select")
        .select("main.py")
      cy.contains(testString)
    })
  })
})
