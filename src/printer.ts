import * as ts from 'typescript'
import * as A from './ast'
import * as M from './model'
import { Reader } from 'fp-ts/lib/Reader'

export interface Printer<A> extends Reader<A.Options, A> {}

export const ast = (ast: ts.Node): string => {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  })
  const source = ts.createSourceFile('', '', ts.ScriptTarget.Latest)
  return printer.printNode(ts.EmitHint.Unspecified, ast, source)
}

export const data = (d: M.Data): Printer<string> => {
  return A.data(d).map(declarations => declarations.map(ast).join('\n\n'))
}

export const constructors = (d: M.Data): Printer<Array<string>> => {
  return A.constructors(d).map(nodes => nodes.map(ast))
}

export const fold = (d: M.Data): Printer<Array<string>> => {
  return A.fold(d).map(functionDeclarations => functionDeclarations.map(ast))
}

export const all = (d: M.Data): Printer<Array<string>> => {
  return data(d).chain(data =>
    constructors(d).chain(constructors => fold(d).map(folds => [data, ...constructors, ...folds]))
  )
}

export const print = (d: M.Data, options: A.Options = A.defaultOptions): string => {
  return all(d)
    .run(options)
    .join('\n\n')
}
