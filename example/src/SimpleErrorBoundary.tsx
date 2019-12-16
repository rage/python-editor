import * as React from "react"

class SimpleErrorBoundary extends React.Component<any, any> {
  state = {
    error: null,
  }
  static getDerivedStateFromError(error) {
    return { error: error.toString() }
  }

  componentDidCatch(error, info) {
    console.error(error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div>
          Quiz crashed:
          <pre>{this.state.error}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

export default SimpleErrorBoundary
