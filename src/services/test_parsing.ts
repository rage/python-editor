const removeFalseIsNotTrue = (input: string): string => {
  const match = input.match(/^False is not true : (.+)/im)
  return match ? match[1] : input
}

export { removeFalseIsNotTrue }
