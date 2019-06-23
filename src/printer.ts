import * as ts from 'typescript'
import * as Ast from './ast'
import * as M from './model'
import { Reader, reader } from 'fp-ts/lib/Reader'
import * as Mon from 'fp-ts/lib/Monoid'
import * as A from 'fp-ts/lib/Array'

export interface Printer<A> extends Reader<Ast.Options, A> {}

export const ast = (ast: ts.Node): string => {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  })
  const source = ts.createSourceFile('', '', ts.ScriptTarget.Latest)
  return printer.printNode(ts.EmitHint.Unspecified, ast, source)
}

export const data = (d: M.Data): Printer<string> => {
  return Ast.data(d).map(declarations => declarations.map(ast).join('\n\n'))
}

export const constructors = (d: M.Data): Printer<Array<string>> => {
  return Ast.constructors(d).map(nodes => nodes.map(ast))
}

export const folds = (d: M.Data): Printer<Array<string>> => {
  return Ast.folds(d).map(functionDeclarations => functionDeclarations.map(ast))
}

export const prisms = (d: M.Data): Printer<Array<string>> => {
  return Ast.prisms(d).map(nodes => nodes.map(ast))
}

export const setoid = (d: M.Data): Printer<Array<string>> => {
  return Ast.setoid(d).map(nodes => nodes.map(ast))
}

export const getMonoid = <A>(M: Mon.Monoid<A>): Mon.Monoid<Printer<A>> => {
  return {
    concat: (x, y) => new Reader(e => M.concat(x.run(e), y.run(e))),
    empty: reader.of(M.empty)
  }
}

const monoidPrinter: Mon.Monoid<Printer<Array<string>>> = getMonoid(A.getMonoid<string>())

export const all = (d: M.Data): Printer<Array<string>> => {
  return Mon.fold(monoidPrinter)([data(d).map(A.array.of), constructors(d), folds(d), prisms(d), setoid(d)])
}

export const print = (d: M.Data, options: Ast.Options): string => {
  return all(d)
    .run(options)
    .join('\n\n')
}
