import * as ts from 'typescript'
import * as Ast from './ast'
import * as M from './model'
import * as R from 'fp-ts/lib/Reader'
import * as Mon from 'fp-ts/lib/Monoid'
import * as A from 'fp-ts/lib/Array'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'

/**
 * @since 0.4.0
 */
export interface Printer<A> extends R.Reader<Ast.Options, A> {}

/**
 * @since 0.4.0
 */
export function ast(ast: ts.Node): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  })
  const source = ts.createSourceFile('', '', ts.ScriptTarget.Latest)
  return printer.printNode(ts.EmitHint.Unspecified, ast, source)
}

/**
 * @since 0.4.0
 */
export function data(d: M.Data): Printer<string> {
  return pipe(
    Ast.data(d),
    R.map(declarations => declarations.map(ast).join('\n\n'))
  )
}

/**
 * @since 0.4.0
 */
export function constructors(d: M.Data): Printer<Array<string>> {
  return pipe(
    Ast.constructors(d),
    R.map(nodes => nodes.map(ast))
  )
}

/**
 * @since 0.4.0
 */
export function fold(d: M.Data): Printer<string> {
  return pipe(
    Ast.fold(d),
    R.map(functionDeclaration =>
      pipe(
        functionDeclaration,
        O.map(ast),
        O.getOrElse(() => '')
      )
    )
  )
}

/**
 * @since 0.4.0
 */
export function prisms(d: M.Data): Printer<Array<string>> {
  return pipe(
    Ast.prisms(d),
    R.map(nodes => nodes.map(ast))
  )
}

/**
 * @since 0.4.0
 */
export function eq(d: M.Data): Printer<Array<string>> {
  return pipe(
    Ast.eq(d),
    R.map(nodes => nodes.map(ast))
  )
}

/**
 * @since 0.4.0
 */
export function getMonoid<A>(M: Mon.Monoid<A>): Mon.Monoid<Printer<A>> {
  return {
    concat: (x, y) => e => M.concat(x(e), y(e)),
    empty: R.of(M.empty)
  }
}

const monoidPrinter: Mon.Monoid<Printer<Array<string>>> = getMonoid(A.getMonoid<string>())

/**
 * @since 0.4.0
 */
export function all(d: M.Data): Printer<Array<string>> {
  return Mon.fold(monoidPrinter)([
    pipe(
      data(d),
      R.map(A.array.of)
    ),
    constructors(d),
    pipe(
      fold(d),
      R.map(s => [s])
    ),
    prisms(d),
    eq(d)
  ])
}

/**
 * @since 0.4.0
 */
export function print(options: Ast.Options): (d: M.Data) => string {
  return d => all(d)(options).join('\n\n')
}
