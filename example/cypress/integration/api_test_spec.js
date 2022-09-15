//@ts-check
/// <reference types="cypress" />

describe("API Endpoint tests #1", () => {
  const program = '# A simple program\nprint("hello from", "python")\n'
  const workingProgram = '# Hymio\nprint(":", end="")\nprint("-)", end="")'
  const inputOrganization = "test"
  const inputCourse = "python-test"
  const inputExercise = "osa01-01_hymio"
  const inputUserId = "test"
  const inputToken = "49a491a3fc7"

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
    cy.wait(10000)
    cy.get("[data-cy=load-btn]").click()
    cy.wait("@getExercise")
    cy.wait("@getExerciseDownload")
  })

  it("should not have sign-in warning", () => {
    cy.contains("Sign in to submit exercise").should("not.exist")
  })

  it("fail to solve exercise, shows correct information", () => {
    cy.intercept("POST", "**/api/v8/core/exercises/90703/submissions", {
      fixture: "post_submission_content.json",
    })
    cy.intercept("GET", "**/api/v8/core/submissions/123123", {
      fixture: "result_submission_fail.json",
    })

    cy.get(".monaco-editor")
      .first()
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type(program)
    cy.get("[data-cy=test-btn]").click()
    cy.get("[data-cy=output-container]").contains(
      "'hello from python' != ':-)'",
    )
    cy.get("[data-cy=submit-btn]").click()
    cy.contains("Submitting")
    cy.contains("FAIL: HymioTest: test_print_hymio")
  })

  it("ask for help works with failed tests", () => {
    cy.get(".monaco-editor")
      .first()
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type(program + "asd")
    cy.get("[data-cy=run-btn]").click()
    cy.get("[data-cy=output-container]").contains("Need help?")
    cy.get("[data-cy=need-help-btn]").click()
    cy.contains("TMC Paste")
    cy.get("[data-cy=send-to-paste-btn]").click()
    cy.get("[data-cy=copy-text-btn]").click()
    cy.contains("Copied!")
  })

  it("solve exercise correctly gives points, congratulates, feedback form, model solution", () => {
    cy.intercept("POST", "**/api/v8/core/exercises/90703/submissions", {
      fixture: "post_submission_content.json",
    })
    cy.intercept("GET", "**/api/v8/core/submissions/123123", {
      fixture: "result_submission_passed.json",
    })

    const testString = "print(':-)')"
    cy.get(".monaco-editor")
      .first()
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type(workingProgram)
    cy.get("[data-cy=test-btn]").click()

    cy.wait(250)
    cy.contains("Points awarded: 1.1")
    cy.contains("Question A")
    cy.contains("Question B")
    cy.contains("congratulations")
    cy.contains("View model solution")
    cy.get("[data-cy=yes-feedback]").should("be.disabled")
    cy.get("[data-cy=feedback-text]")
      .first()
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type(testString)
    cy.get("[data-cy=yes-feedback]").should("not.be.disabled")
    cy.get("[data-cy=no-feedback]").click()
    cy.get("[data-cy=show-all-results-checkbox]").click()
    cy.get("[data-cy=test-result]").should("have.length", 1)
  })

  it("non-expired deadline has no warning", () => {
    cy.contains("Exercise deadline exceeded.").should("not.exist")
  })
})

describe("API Endpoint tests #2", () => {
  const inputOrganization = "test"
  const inputCourse = "python-test"
  const inputExercise = "osa01-01_hymio"
  const inputUserId = "test"
  const inputToken = "49a491a3fc7"

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
      { fixture: "get_expired_exercise.json" },
    ).as("getExpiredExercise")
    cy.intercept("GET", "**/api/v8/exercises/90703/users/current/submissions", {
      fixture: "old_submissions.json",
    })
    cy.intercept(
      "GET",
      `**/api/v8/org/${inputOrganization}/courses/${inputCourse}/exercises/${inputExercise}/download`,
      { fixture: "osa01-01_hymio.zip" },
    ).as("getExerciseDownload")

    // require("../helpers/pyodide_helper").interceptPyodide(cy)
    cy.visit("/")
    cy.wait(10000)
    cy.get("[data-cy=load-btn]").click()
    cy.wait("@getExpiredExercise")
    cy.wait("@getExerciseDownload")
  })

  it("expired exercise has model solution and deadline warning", () => {
    cy.contains("Model solution")
    cy.contains("Exercise deadline exceeded.")
  })
})
