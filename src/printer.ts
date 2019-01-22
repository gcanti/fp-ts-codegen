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

export const print = (d: M.Data): string => {
  const dataCode = data(d)
  const constructorsCode = constructors(d)
  const foldCode = fold(d)
  return [dataCode, ...constructorsCode, ...foldCode].join('\n\n')
}
