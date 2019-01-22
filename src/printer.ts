import { tuple } from 'fp-ts/lib/function'
import * as F from 'prettier'
import * as M from './model'

const getTypeParameters = (parameters: Array<string>): string => {
  if (parameters.length === 0) {
    return ''
  } else {
    return `<${parameters.join(', ')}>`
  }
}

export const definition = (d: M.Introduction): string => {
  return d.name + getTypeParameters(d.parameters)
}

const toDefinition = (t: M.Type): M.Introduction => {
  return M.introduction(t.name, t.parameters.map(p => p.name))
}

export const type = (t: M.Type): string => {
  return definition(toDefinition(t))
}

const getMemberName = (f: M.Member, position: number): string => {
  switch (f._tag) {
    case 'PositionalMember':
      return `value${position}`
    case 'NamedMember':
      return f.name
  }
}

export const member = (f: M.Member, position: number): [string, string] => {
  return tuple(getMemberName(f, position), type(f.type))
}

const objectType = (fields: Array<[string, string]>): string => {
  return '{\n' + fields.map(([name, value]) => `readonly ${name}: ${value}`).join(', ') + '\n}'
}

const objectValue = (fields: Array<[string, string]>): string => {
  return '{\n' + fields.map(([name, value]) => (name === value ? name : `${name}: ${value}`)).join(', ') + '\n}'
}

export const constructor = (c: M.Constructor): string => {
  return objectType([tuple('type', JSON.stringify(c.name))].concat(c.members.map((f, i) => member(f, i))))
}

export const data = (d: M.Data): string => {
  return `export type ${definition(d.introduction)} = ${d.constructors
    .toArray()
    .map(c => constructor(c))
    .join(' | ')}`
}

const getFunctionType = (
  typeParameters: string,
  parameters: Array<[string, string]>,
  returnType: string,
  isArrow: boolean
): string => {
  const returnTypeSyntax = isArrow ? ' => ' : ': '
  return `${typeParameters}(${parameters
    .map(([name, type]) => `${name}: ${type}`)
    .join(', ')})${returnTypeSyntax}${returnType}`
}

const getFunctionDefinition = (
  name: string,
  typeParameters: string,
  parameters: Array<[string, string]>,
  returnType: string,
  returnValue: string
): string => {
  return `export const ${name} = ${getFunctionType(
    typeParameters,
    parameters,
    returnType,
    false
  )} => { ${returnValue} }`
}

const getConstructorName = (name: string): string => {
  return name.substring(0, 1).toLocaleLowerCase() + name.substring(1)
}

const getNullaryConstructor = (c: M.Constructor, d: M.Introduction): string => {
  let type = d.name
  if (d.parameters.length > 0) {
    type += '<' + d.parameters.map(() => 'never').join(', ') + '>'
  }
  return `export const ${getConstructorName(c.name)}: ${type} = { type: ${JSON.stringify(c.name)} }`
}

const getConstructor = (c: M.Constructor, d: M.Introduction): string => {
  if (c.members.length === 0) {
    return getNullaryConstructor(c, d)
  }
  const typeParameters = getTypeParameters(d.parameters)
  const parameters = c.members.map((f, i) => member(f, i))
  const returnType = definition(d)
  const returnValue =
    'return ' +
    objectValue(
      [tuple('type', JSON.stringify(c.name))].concat(
        c.members.map((f, i) => {
          const name = getMemberName(f, i)
          return tuple(name, name)
        })
      )
    )
  return getFunctionDefinition(getConstructorName(c.name), typeParameters, parameters, returnType, returnValue)
}

export const constructors = (d: M.Data): Array<string> => {
  return d.constructors.toArray().map(c => getConstructor(c, d.introduction))
}

const getHandlerName = (c: M.Constructor): string => {
  return `on${c.name}`
}

const getFoldReturnTypeParameterName = (i: M.Introduction): string => {
  const base = 'R'
  let candidate = base
  let counter = 0
  while (i.parameters.indexOf(candidate) !== -1) {
    candidate = base + ++counter
  }
  return candidate
}

const isNullaryConstructor = (c: M.Constructor): boolean => {
  return c.members.length === 0
}

const admitsEagerFold = (d: M.Data): boolean => {
  return d.constructors.toArray().some(isNullaryConstructor)
}

const isSumType = (d: M.Data): boolean => {
  return d.constructors.length() > 1
}

const getFold = (d: M.Data, name: string, eager: boolean): string => {
  const returnType = getFoldReturnTypeParameterName(d.introduction)
  const typeParameters = getTypeParameters([...d.introduction.parameters, returnType])
  const parameters: Array<[string, string]> = [tuple('fa', definition(d.introduction))].concat(
    d.constructors.toArray().map(c => {
      const name = getHandlerName(c)
      const parameters = c.members.map((f, i) => member(f, i))
      const handler = eager && isNullaryConstructor(c) ? returnType : getFunctionType('', parameters, returnType, true)
      return tuple(name, handler)
    })
  )
  const returnValue = `switch (fa.type) { ${d.constructors
    .toArray()
    .map(c => {
      const handler =
        eager && isNullaryConstructor(c)
          ? getHandlerName(c)
          : `${getHandlerName(c)}(${c.members.map((f, i) => `fa.${getMemberName(f, i)}`)})`
      return `case ${JSON.stringify(c.name)} : return ${handler}`
    })
    .join('; ')} }`
  return getFunctionDefinition(name, typeParameters, parameters, returnType, returnValue)
}

export const fold = (d: M.Data): Array<string> => {
  if (!isSumType(d)) {
    return []
  }
  if (admitsEagerFold(d)) {
    return [getFold(d, 'fold', true), getFold(d, 'foldL', false)]
  }
  return [getFold(d, 'fold', false)]
}

const defaultOptions: Options = {
  prettier: {
    semi: false,
    singleQuote: true,
    printWidth: 120,
    parser: 'typescript'
  }
}

interface Options {
  prettier: F.Options
}

export const print = (d: M.Data): string => {
  const dataCode = data(d)
  const constructorsCode = constructors(d)
  const foldCode = fold(d)
  const code = [dataCode, ...constructorsCode, ...foldCode].join('\n\n')
  return F.format(code, defaultOptions.prettier)
}
