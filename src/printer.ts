import { tuple } from 'fp-ts/lib/function'
import * as F from 'prettier'
import * as M from './model'

const getTypeParameters = (d: M.Introduction): string => {
  if (d.parameters.length === 0) {
    return ''
  } else {
    return `<${d.parameters.join(', ')}>`
  }
}

export const definition = (d: M.Introduction): string => {
  return d.name + getTypeParameters(d)
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
  const typeParameters = getTypeParameters(d)
  const parameters = c.members.map((f, i) => member(f, i))
  const returnType = definition(d)
  const returnValue =
    'return ' +
    objectType(
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

export const fold = (d: M.Data): string => {
  if (d.introduction.parameters.length === 0) {
    return ''
  }
  const name = `fold${d.introduction.name}L`
  const typeParameters = `<${d.introduction.parameters.join(', ')}, R>`
  const parameters: Array<[string, string]> = [tuple('fa', definition(d.introduction))].concat(
    d.constructors.toArray().map(c => {
      const name = getHandlerName(c)
      const parameters = c.members.map((f, i) => member(f, i))
      return tuple(name, getFunctionType('', parameters, 'R', true))
    })
  )
  const returnType = 'R'
  const returnValue = `switch (fa.type) { ${d.constructors
    .toArray()
    .map(c => {
      return `case ${JSON.stringify(c.name)} : return ${getHandlerName(c)}(${c.members.map(
        (f, i) => `fa.${getMemberName(f, i)}`
      )})`
    })
    .join('; ')} }`
  return getFunctionDefinition(name, typeParameters, parameters, returnType, returnValue)
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
  return F.format(data(d) + '\n\n' + constructors(d).join('\n\n') + '\n\n' + fold(d), defaultOptions.prettier)
}
