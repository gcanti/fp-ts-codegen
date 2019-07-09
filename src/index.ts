import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { parse } from './haskell'
import { print } from './printer'
import { Options, defaultOptions } from './ast'

/**
 * @since 0.4.0
 */
export function run(input: string, options: Options = defaultOptions): E.Either<string, string> {
  return pipe(
    parse(input),
    E.map(print(options))
  )
}
