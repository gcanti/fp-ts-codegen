import * as F from 'prettier'
import * as ts from 'typescript'
import * as A from './ast'
import * as M from './model'

export const ast = (ast: ts.Node): string => {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  })
  const source = ts.createSourceFile('', '', ts.ScriptTarget.Latest)
  return printer.printNode(ts.EmitHint.Unspecified, ast, source)
}

export const data = (d: M.Data): string => {
  return ast(A.data(d))
}

export const constructors = (d: M.Data): Array<string> => {
  return A.constructors(d).map(ast)
}

export const fold = (d: M.Data): Array<string> => {
  return A.fold(d).map(ast)
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
