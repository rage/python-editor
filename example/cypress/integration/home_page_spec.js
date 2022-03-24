//@ts-check
/// <reference types="cypress" />

describe("The Playground", () => {
  const program = '# A simple program\nprint("hello from", "python")\n'
  const inputOrganization = "test"
  const inputCourse = "python-test"
  const inputExercise = "osa01-01_hymio"
  const inputUserId = "test"
  const inputToken = "3213hddf"

  beforeEach(() => {
    window.localStorage.setItem(
      "organization",
      JSON.stringify(inputOrganization),
    )
    window.localStorage.setItem("course", JSON.stringify(inputCourse))
    window.localStorage.setItem("exercise", JSON.stringify(inputExercise))
    window.localStorage.setItem("user-id", JSON.stringify(inputUserId))
    window.localStorage.setItem("token", JSON.stringify(inputToken))

    cy.intercept(
      "GET",
      `**/api/v8/org/${inputOrganization}/courses/${inputCourse}/exercises/${inputExercise}`,
      { fixture: "get_exercise.json" },
    ).as("getExercise")
    cy.intercept("GET", "**/api/v8/exercises/90703/users/current/submissions", {
      fixture: "old_submissions.json",
    })
    cy.intercept(
      "GET",
      `**/api/v8/org/${inputOrganization}/courses/${inputCourse}/exercises/${inputExercise}/download`,
      { fixture: "osa01-01_hymio.zip" },
    ).as("getExerciseDownload")
    cy.intercept("GET", "**/api/v8/core/submissions/7313248/download", {
      errors: ["Authentication required"],
    })

    // require("../helpers/pyodide_helper").interceptPyodide(cy)
    cy.visit("/")
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(10000)
  })

  describe("Running code", () => {
    it("code produces output", () => {
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(program)
      cy.get("[data-cy=run-btn]").click()
      cy.contains("hello from python")
    })

    it("close button hides output", () => {
      cy.get(".monaco-editor")
        .first()
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
      cy.get(".monaco-editor")
        .first()
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

    it("displays input prompt & waiting indication in title", () => {
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(inputProgram)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=output-container]").contains("Enter a word:")
      cy.get("[data-cy=user-input-field]").contains(
        'Enter input and press "Enter"',
      )
      cy.contains("Waiting for input")
    })

    it("can enter input value and add it to output", () => {
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(inputProgram)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=user-input-field]")
        .find("input")
        .type("cat")
        .type("{enter}")
      cy.contains("cat")
    })

    it("hides input field and changes title after entering input", () => {
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(inputProgram)
      cy.get("[data-cy=run-btn]").click()
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
      cy.get(".monaco-editor")
        .first()
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
      // cy.contains("# This is the default file test.py")
      cy.get("[data-cy=select-file]").find("select").select("main.py")
      cy.contains(testString)
    })
  })
})
