export function remove_fstrings(code: string): string {
  let counter: number
  let list: Array<string>

  function f2(match: string, part: string): string {
    const result = "{" + counter + "}"
    counter++
    list.push(part)
    return result
  }

  function f1(match: string, part: string): string {
    counter = 0
    list = []
    part = part.replace(/\{(.*?)\}/g, f2)
    return match[1] + part + match[1] + ".format(" + list.join() + ")"
  }

  code = code.replace(/f"(.*?)"/g, f1)
  code = code.replace(/f'(.*?)'/g, f1)
  return code
}
