# Moocfi Python Editor

[![NPM version](https://img.shields.io/npm/v/moocfi-python-editor.svg?style=flat-square)](https://www.npmjs.com/package/moocfi-python-editor)
![Cypress End-2-End Tests](https://github.com/rage/python-editor/workflows/Cypress%20End-2-End%20Tests/badge.svg)

Moocfi Python Editor is a React component that provides an in-browser editing,
running and testing environment for [TestMyCode](https://tmc.mooc.fi/) python
courses. The editor is based on
[Pyodide python runtime environment](https://github.com/iodide-project/pyodide)
that is run using webworkers.

## Usage

Install with `npm install moocfi-python-editor`.

The editor component can be used in a following way:

```jsx
import { ProgrammingExercise } from "moocfi-python-editor"

const App = () => {
  // ...

  return (
    <ProgrammingExercise
      organization="organization-slug"
      course="course-name"
      exercise="exercise-name"
      username="username"
      token="user-token"
    />
  )
}
```

Required properties:

- `organization`, `course` and `exercise` Define which TMC exercise will be loaded.
- `username` and `token` are used to identify the current user.

Optional properties:

- `debug` Show and log debug information if set to `true`.
- `language` Editor's localization. Currently supports `en` (default) and `fi`.
- `height` Height of the editor. Defaults to `400px`.
- `outputHeight` Maximum height of the output content in pixels.
- `onExerciseDetailsChange` Callback function that provides details about the exercise. These details vary by user.

## Setting up the project

1. Clone the project on GitHub
2. Go to the project root directory and run `npm ci` & `npm run encode:worker`
3. Go to the `example` directory and run `npm ci`

## Running the project

To run the project in example environment, go to the `example` directory and
run `npm start`.

If you make any changes to the worker, you will always need to run the `encode:worker` command again.

## License

This project is licensed under either of

- Apache License, Version 2.0, ([LICENSE](LICENSE) or https://www.apache.org/licenses/LICENSE-2.0)
- MIT license, ([LICENSE-MIT](LICENSE-MIT) or https://opensource.org/licenses/MIT)

at your option.
