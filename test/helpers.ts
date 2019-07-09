import * as assert from 'assert'
import { defaultOptions, Options } from '../src/ast'
import * as P from '../src/printer'

export const assertPrinterEqual = <A, B>(
  f: (a: A) => P.Printer<B>,
  a: A,
  expected: B,
  options: Options = defaultOptions
) => {
  const actual = f(a)(options)
  assert.deepStrictEqual(actual, expected)
}
