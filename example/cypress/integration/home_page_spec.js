const program = '# A simple program\nprint("hello from", "python")\n'
const inputOrganization = "test"
const inputCourse = "python-test"
const inputExercise = "osa01-01_hymio"
const inputToken = "3213hddf"

describe("The Playground", () => {
  describe("The main page", () => {
    it("successfully loads", () => {
      cy.visit("/")
    })

    it("has a organization input field", () => {
      cy.get("[data-cy=organization-input]")
        .find("input")
        .type(inputOrganization)
        .should("have.value", inputOrganization)
    })

    it("can get organization from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("organization", inputOrganization)
      cy.get("[data-cy=organization-input]")
        .find("input")
        .should("have.value", inputOrganization)
    })

    it("has a course input field", () => {
      cy.get("[data-cy=course-input]")
        .find("input")
        .type(inputCourse)
        .should("have.value", inputCourse)
    })

    it("can get course from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("course", inputCourse)
      cy.get("[data-cy=course-input]")
        .find("input")
        .should("have.value", inputCourse)
    })

    it("has an exercise input field", () => {
      cy.get("[data-cy=exercise-input]")
        .find("input")
        .type(inputExercise)
        .should("have.value", inputExercise)
    })

    it("can get exercise from local storage", () => {
      cy.visit("/")
      window.localStorage.setItem("exercise", inputExercise)
      cy.get("[data-cy=exercise-input]")
        .find("input")
        .should("have.value", inputExercise)
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

    it("running code without token gives sign in warning", () => {
      cy.visit("/")
      cy.get("[data-cy=run-btn]").click()
      cy.contains("Sign in to submit exercise")
    })

    it("running code with token has no sign in warning", () => {
      cy.visit("/")
      cy.server()
      cy.route("GET", "/api/v8/org//courses//exercises//download", "")
      cy.route("GET", "/api/v8/org//courses//exercises//", "")
      window.localStorage.setItem("token", inputToken)
      cy.get("[data-cy=load-btn]").click()
      cy.get("[data-cy=token-input]")
        .find("input")
        .should("have.value", inputToken)
      cy.get("[data-cy=run-btn]").click()
      cy.contains("Sign in to submit exercise").should("not.exist")
    })

    it("has a load quiz button", () => {
      cy.get("[data-cy=load-btn]")
    })

    it("has an unload quiz button", () => {
      cy.get("[data-cy=unload-btn]")
    })

    /*
    it("has a print editor content button", () => {
      cy.get("[data-cy=print-btn]").click()
    })
    */

    it("has a run code button", () => {
      cy.get("[data-cy=run-btn]").click()
    })

    /*
    it("has a run code with wrapped imports button", () => {
      cy.get("[data-cy=run-wrapped-btn]").click()
    })
    */

    it("has an editor input field", () => {
      cy.visit("/")
      cy.get(".monaco-editor")
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(program)
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
      cy.get("[data-cy=stop-btn]").should("not.exist")
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
      cy.get("[data-cy=stop-btn").click()
      cy.get("[data-cy=stop-btn]").should("not.exist")
      cy.get("[data-cy=user-input-field]").should("not.exist")
    })
  })

  describe("Using default files", () => {
    it("Unloading quiz brings up default main.py file", () => {
      cy.visit("/")
      cy.get("[data-cy=unload-btn]").click()
      cy.contains("main.py")
    })

    it("main.py contents are displayed", () => {
      cy.contains("# No quiz has been loaded")
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
  describe("Submitting to server tests", () => {
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
      cy.route({
        method: "GET",
        url: "/api/v8/org/test/courses/python-test/exercises/osa01-01_hymio",
        response: "@exercise",
      })
      // TODO: Download fake zip.
      // cy.fixture('osa01-01_hymio.zip').as('zip')
      // cy.route({
      //   method: 'GET',
      //   url: '/api/v8/org/test/courses/python-test/exercises/osa01-01_hymio/download',
      //   response: '@zip',
      //   headers: { 'cache-control': "private", 'content-type': "application/zip"}
      // })
      cy.get("[data-cy=load-btn]").click()
    })

    it("fail to solve quiz, shows correct information", () => {
      const testString = "print('Romanes eunt domus')"
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
        .type(testString)
      cy.contains(testString)
      cy.get("[data-cy=run-btn]").click()
      cy.get("[data-cy=submit-btn]").click()
      cy.contains("Submitting to server")
      cy.contains("0%")
      cy.contains("FAIL: test.test_hymio.HymioTest.test_print_hymio")
    })

    it("ask for help works with failed tests", () => {
      const testString = "print('Jellou world!')"
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(testString)
      cy.contains(testString)
      cy.get("[data-cy=run-btn]").click()
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
      cy.get("[data-cy=submit-btn]").click()
      cy.contains("Need help?")
      cy.get("[data-cy=need-help-btn]").click()
      cy.contains("TMC Paste")
      cy.get("[data-cy=send-to-paste-btn]").click()
      cy.get("[data-cy=copy-text-btn]").click()
      cy.contains("Copied!")
    })

    it("solve quiz correctly gives points, congratulates, feedback form, model solution", () => {
      const testString = "print(':-)')"
      cy.get(".monaco-editor")
        .first()
        .click()
        .focused()
        .type("{ctrl}{end}")
        .type("{shift}{ctrl}{home}{backspace}")
        .type(testString)
      cy.contains(testString)
      cy.get("[data-cy=run-btn]").click()
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
      cy.get("[data-cy=submit-btn]").click()
      cy.contains("Submitting to server")
      cy.wait(250)
      cy.contains("Tests passed")
      cy.contains("100%")
      cy.contains("Points awarded: 1.1")
      cy.contains("Question A")
      cy.contains("Question B")
      cy.contains("congratulations")
      cy.contains("View model solution")
      cy.get("[data-cy=no-feedback]").click()
      cy.get("[data-cy=show-all-results-checkbox]").click()
      cy.get("[data-cy=test-result]").should("have.length", 1)
    })
  })
})
