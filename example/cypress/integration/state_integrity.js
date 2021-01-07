const inputOrganization = "test"
const inputCourse = "python-test"
const inputExercise = "osa01-01_hymio"
const inputToken = "49a491a3fc7"
const program = '# A simple program\nprint("hello from", "python")\n'

describe("State integrity tests", () => {
  beforeEach(() => {
    cy.visit("/")
    window.localStorage.setItem("organization", "")
    window.localStorage.setItem("course", "")
    window.localStorage.setItem("exercise", "")
    window.localStorage.setItem("token", "")
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
    cy.server()
    cy.fixture("get_expired_exercise.json").as("exerciseExpired")
    cy.fixture("get_exercise.json").as("exercise")
    cy.fixture("post_submission_content.json").as("sendSubmission")
    cy.fixture("result_submission_fail.json").as("resultSubmissionFail")
    cy.fixture("result_submission_passed.json").as("resultSubmissionPass")
    cy.fixture("old_submissions.json").as("oldSubmissions")
    cy.route({
      method: "GET",
      url: "/api/v8/exercises/90703/users/current/submissions",
      response: "@oldSubmissions",
    })
    cy.route({
      method: "GET",
      url: "/api/v8/org/test/courses/python-test/exercises/osa01-01_hymio",
      response: "@exerciseExpired",
    }).as("exerciseExpired")
    cy.route({
      method: "GET",
      url: "/api/v8/core/submissions/7313248/download",
      response: { errors: ["Authentication required"] },
    })
    cy.route({
      method: "GET",
      url: `/api/v8/org/${inputOrganization}/courses/${inputCourse}/exercises/${inputExercise}/download`,
      response: "fx:osa01-01_hymio.zip,binary",
    })
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
