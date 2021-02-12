//@ts-check
/// <reference types="cypress" />

describe("State integrity tests", () => {
  const inputOrganization = "test"
  const inputCourse = "python-test"
  const inputExercise = "osa01-01_hymio"
  const inputToken = "49a491a3fc7"
  const program = '# A simple program\nprint("hello from", "python")\n'

  beforeEach(() => {
    window.localStorage.setItem("organization", inputOrganization)
    window.localStorage.setItem("course", inputCourse)
    window.localStorage.setItem("exercise", inputExercise)
    window.localStorage.setItem("token", inputToken)

    cy.intercept(
      "GET",
      `**/api/v8/org/${inputOrganization}/courses/${inputCourse}/exercises/${inputExercise}`,
      { fixture: "get_exercise.json" },
    ).as("getExercise")
    cy.intercept(
      "GET",
      `**/api/v8/org/${inputOrganization}/courses/${inputCourse}/exercises/${inputExercise}/download`,
      { fixture: "osa01-01_hymio.zip" },
    ).as("getExerciseDownload")

    cy.visit("/")
    // Wait for the Pyodide from download.mooc.fi
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
    cy.wait(12000)
    cy.get("[data-cy=run-btn]").click()
    cy.get("[data-cy=user-input-field]")
    cy.get("[data-cy=stop-btn]").click()
    cy.wait(12000)
    cy.get("[data-cy=run-btn]").click()
    cy.get("[data-cy=user-input-field]").find("input").type("one{enter}")
    cy.get("[data-cy=user-input-field]").find("input").type("two{enter}")
    cy.get("[data-cy=user-input-field]").find("input").type("three{enter}")
    cy.contains("made it to the end")
  })

  it("Can reset exercise template to its initial state", () => {
    cy.visit("/")
    window.localStorage.setItem("organization", inputOrganization)
    window.localStorage.setItem("course", inputCourse)
    window.localStorage.setItem("exercise", inputExercise)
    window.localStorage.setItem("token", inputToken)

    cy.get("[data-cy=load-btn]").click()
    cy.wait(1000)
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
