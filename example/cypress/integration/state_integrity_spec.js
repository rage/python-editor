//@ts-check
/// <reference types="cypress" />

describe("State integrity tests", () => {
  const inputOrganization = "test"
  const inputCourse = "python-test"
  const inputExercise = "osa01-01_hymio"
  const inputToken = "49a491a3fc7"
  const program = '# A simple program\nprint("hello from", "python")\n'

  beforeEach(() => {
    window.localStorage.setItem(
      "organization",
      JSON.stringify(inputOrganization),
    )
    window.localStorage.setItem("course", JSON.stringify(inputCourse))
    window.localStorage.setItem("exercise", JSON.stringify(inputExercise))
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
    cy.wait(10000)
    cy.get("[data-cy=load-btn]").click()
    cy.wait("@getExercise")
    cy.wait("@getExerciseDownload")
  })

  it("Can handle complex state changes that involve input()", () => {
    cy.get(".monaco-editor")
      .first()
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type("input()\ninput()\ninput()\nprint('made it to the end')")
    cy.wait(5000)
    cy.get("[data-cy=run-btn]").click()
    cy.get("[data-cy=user-input-field]")
    cy.get("[data-cy=stop-btn]").click()
    cy.wait(5000)
    cy.get("[data-cy=run-btn]").click()
    cy.get("[data-cy=user-input-field]").find("input").type("one{enter}")
    cy.get("[data-cy=user-input-field]").find("input").type("two{enter}")
    cy.get("[data-cy=user-input-field]").find("input").type("three{enter}")
    cy.contains("made it to the end")
  })

  it("Can reset exercise template to its initial state", () => {
    cy.get("[data-cy=load-btn]").click()
    cy.get(".monaco-editor")
      .first()
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type(program)
    cy.get("[data-cy=reset-btn]").click()
    cy.contains("Reset exercise template")
    cy.get("[data-cy=reset-btn-ok]").click()
    cy.contains(program).should("not.exist")
    cy.wait(100)
    cy.contains("Kirjoita ratkaisu tähän")
  })
})
