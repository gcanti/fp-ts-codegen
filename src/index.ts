import { Either } from 'fp-ts/lib/Either'
import { parse } from './parser'
import { print } from './printer'
import { Options, defaultOptions } from './ast'

export function run(input: string, options: Options = defaultOptions): Either<string, string> {
  return parse(input).map(data => print(data, options))
}
