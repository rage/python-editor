const removeFalseIsNotTrue = (input: string): string => {
  const match = input.match(/^False is not true : ([\s\S]+)/i)
  return match ? match[1] : input
}

export { removeFalseIsNotTrue }
