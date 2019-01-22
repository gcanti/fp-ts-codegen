import { Either } from 'fp-ts/lib/Either'
import { parse } from './parser'
import { print } from './printer'

export const run = (input: string): Either<string, string> => {
  return parse(input).map(print)
}
