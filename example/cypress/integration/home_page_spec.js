const program = '# A simple program\nprint("hello from", "python")\n'
const inputOrganization = "test"
const inputCourse = "python-test"
const inputExercise = "osa01-01_hymio"
const inputToken = "3213hddf"

describe("The Playground", () => {
  it("successfully loads", () => {
    cy.visit("/")
  })

  describe("Has elements", () => {
    it("has a organization input field", () => {
      cy.get("[data-cy=organization-input]")
        .find("input")
        .type(inputOrganization)
        .should("have.value", inputOrganization)
    })

    it("has a course input field", () => {
      cy.get("[data-cy=course-input]")
        .find("input")
        .type(inputCourse)
        .should("have.value", inputCourse)
    })

    it("has an exercise input field", () => {
      cy.get("[data-cy=exercise-input]")
        .find("input")
        .type(inputExercise)
        .should("have.value", inputExercise)
    })

    it("has a user token input field", () => {
      cy.get("[data-cy=token-input]")
        .find("input")
        .type(inputToken)
        .should("have.value", inputToken)
    })

    it("has a load exercise button", () => {
      cy.get("[data-cy=load-btn]")
    })

    it("has an unload exercise button", () => {
      cy.get("[data-cy=unload-btn]")
    })

    it("has a run code button", () => {
      cy.visit("/")
      cy.get("[data-cy=run-btn]").click()
    })

    it("has an editor field", () => {
      cy.visit("/")
      cy.get(".monaco-editor")
    })
  })

  describe("Local storage", () => {
    it("can get organization from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("organization", inputOrganization)
      cy.get("[data-cy=organization-input]")
        .find("input")
        .should("have.value", inputOrganization)
    })

    it("can get course from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("course", inputCourse)
      cy.get("[data-cy=course-input]")
        .find("input")
        .should("have.value", inputCourse)
    })

    it("can get exercise from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("exercise", inputExercise)
      cy.get("[data-cy=exercise-input]")
        .find("input")
        .should("have.value", inputExercise)
    })

    it("can get token from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("token", inputToken)
      cy.get("[data-cy=token-input]")
        .find("input")
        .should("have.value", inputToken)
    })
  })

  describe("Running code", () => {
    it("without token gives sign in warning", () => {
      cy.visit("/")
      cy.contains("Sign in to submit exercise")
    })

    it("code produces output", () => {
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(program)
      cy.get("[data-cy=run-btn]").click()
      cy.contains("hello from python")
    })

    it("close button hides output", () => {
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(program)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=close-btn").click()
      cy.contains("hello from python").should("not.exist")
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
      cy.get("[data-cy=stop-btn]").should("not.be.disabled")
    })
  })

  describe("Input tests", () => {
    const inputProgram = 'input("Enter a word:")'
    beforeEach(() => {
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(inputProgram)
      cy.get("[data-cy=run-btn]").click()
    })

    it("displays input prompt", () => {
      cy.get("[data-cy=output-container]").contains("Enter a word:")
    })

    it("displays waiting indication in title", () => {
      cy.contains("Waiting for input")
    })

    it("displays input field with label", () => {
      cy.get("[data-cy=user-input-field]").contains(
        'Enter input and press "Enter"',
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
      cy.get("[data-cy=user-input-field]")
        .find("input")
        .type("cat")
        .type("{enter}")
      cy.contains("cat")
      cy.get("[data-cy=user-input-field]").should("not.exist")
      cy.contains("Waiting for input").should("not.exist")
    })
  })

  describe("Halting program", () => {
    const infiniteProgram = "while True:\n  x = 0"
    it("stops program if stop button is clicked", () => {
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(infiniteProgram)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=stop-btn]").click()
      cy.get("[data-cy=stop-btn]").should("not.exist")
      cy.get("[data-cy=user-input-field]").should("not.exist")
    })
  })

  describe("Using default files", () => {
    it("Unloading exercise brings up default main.py file", () => {
      cy.visit("/")
      cy.get("[data-cy=unload-btn]").click()
      cy.contains("main.py")
    })

    it("main.py contents are displayed", () => {
      cy.contains("# No ProgrammingExercise has been loaded")
    })

    it("test.py can be selected and displayed", () => {
      cy.get("[data-cy=select-file]").find("select").select("test.py")
      cy.contains("# This is the default file test.py")
    })

    it("edits to source files persist", () => {
      const testString = "Romanes eunt domus"
      cy.get("[data-cy=select-file]").find("select").select("main.py")
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(testString)
      cy.get("[data-cy=select-file]").find("select").select("test.py")
      cy.contains("This is the default file test.py")
      cy.get("[data-cy=select-file]").find("select").select("main.py")
      cy.contains(testString)
    })
  })
  /*
  describe("Running default tests", () => {
    it("displays testing title in output title box", () => {
      cy.visit("/")
      cy.get("[data-cy=run-tests-btn]").click()
      cy.contains("Test Results")
    })

    it("displays passed tests progress bar on output title", () => {
      cy.get("[data-cy=run-tests-btn]").click()
      cy.contains("Tests passed")
      cy.contains("83%")
    })

    it("initially shows output of one failed test only", () => {
      cy.get("[data-cy=test-result]").should("have.length", 1)
      cy.get("[data-cy=test-result]").contains("FAIL")
    })

    it('checking "Show all" shows all test results', () => {
      cy.get("[data-cy=show-all-results-checkbox]").click()
      cy.get("[data-cy=test-result]").should("have.length", 6)
    })
  })
  */
})
