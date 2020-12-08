const program = '# A simple program\nprint("hello from", "python")\n'
const workingProgram = '# Hymio\nprint(":", end="")\nprint("-)", end="")'
const inputOrganization = "test"
const inputCourse = "python-test"
const inputExercise = "osa01-01_hymio"
const inputToken = "49a491a3fc7"

describe("API Endpoint tests #1", () => {
  beforeEach(() => {
    cy.visit("/")
    window.localStorage.setItem("organization", inputOrganization)
    window.localStorage.setItem("course", inputCourse)
    window.localStorage.setItem("exercise", inputExercise)
    window.localStorage.setItem("token", inputToken)
    cy.server()
    cy.fixture("get_exercise.json").as("exercise")
    cy.fixture("post_submission_content.json").as("sendSubmission")
    cy.fixture("result_submission_fail.json").as("resultSubmissionFail")
    cy.fixture("result_submission_passed.json").as("resultSubmissionPass")
    cy.fixture("old_submissions.json").as("oldSubmissions")
    cy.route({
      method: "GET",
      url: "/api/v8/org/test/courses/python-test/exercises/osa01-01_hymio",
      response: "@exercise",
    })
    cy.route({
      method: "GET",
      url: "/api/v8/exercises/90703/users/current/submissions",
      response: "@oldSubmissions",
    })
    cy.route({
      method: "GET",
      url: "/api/v8/core/submissions/7313248/download",
      response: { errors: ["Authentication required"] },
    })
    cy.route({
      method: "GET",
      url: `/api/v8/org/${inputOrganization}/courses/${inputCourse}/exercises/${inputExercise}/download`,
      response: "fx:osa01-01_hymio.zip,binary",
    }).as("getExercise")
    // Wait for the Pyodide from download.mooc.fi
    cy.wait(10000)
    cy.get("[data-cy=load-btn]").click()
    cy.wait("@getExercise")
  })

  it("should not have sign-in warning", () => {
    cy.contains("Sign in to submit exercise").should("not.exist")
  })

  it("fail to solve exercise, shows correct information", () => {
    cy.route({
      method: "POST",
      url: "/api/v8/core/exercises/90703/submissions",
      response: "@sendSubmission",
    })
    cy.route({
      method: "GET",
      url: "/api/v8/core/submissions/123123",
      response: "@resultSubmissionFail",
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
    const testString = "print(':-)')"
    cy.get(".monaco-editor")
      .first()
      .click()
      .focused()
      .type("{ctrl}{end}")
      .type("{shift}{ctrl}{home}{backspace}")
      .type(workingProgram)
    cy.get("[data-cy=test-btn]").click()
    cy.route({
      method: "POST",
      url: "/api/v8/core/exercises/90703/submissions",
      response: "@sendSubmission",
    })
    cy.route({
      method: "GET",
      url: "/api/v8/core/submissions/123123",
      response: "@resultSubmissionPass",
    })
    // cy.contains("PASS")
    // cy.get("[data-cy=submit-btn]").click()
    // cy.contains("Submitting")
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
  beforeEach(() => {
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
  })

  it("expired exercise has model solution and deadline warning", () => {
    cy.contains("Model solution")
    cy.contains("Exercise deadline exceeded.")
  })
})
