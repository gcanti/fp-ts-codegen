import * as P from 'parser-ts'
import * as S from 'parser-ts/lib/string'
import * as C from 'parser-ts/lib/char'
import * as M from './model'
import { Either } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'
import { tuple } from 'fp-ts/lib/function'

const isDigit = (c: string): boolean => '0123456789'.indexOf(c) !== -1

const isPunctuation = (c: string): boolean => '| =\n():,{};[]'.indexOf(c) !== -1

const identifierFirstLetter = P.sat(c => !isDigit(c) && !isPunctuation(c))

const identifierBody = P.sat(c => !isPunctuation(c))

const expected = <A>(message: string, parser: P.Parser<A>): P.Parser<A> =>
  P.expectedL(parser, remaining => `Expected ${message}, cannot parse ${JSON.stringify(remaining)}`)

export const identifier: P.Parser<string> = expected(
  'an identifier',
  P.fold([identifierFirstLetter, C.many(identifierBody)])
)

const singletonType: P.Parser<M.Type> = identifier.map(name => M.type(name))

const unparenthesizedType: P.Parser<M.Type> = identifier.chain(name =>
  S.spaces.applySecond(P.many(type).map(types => M.type(name, types)))
)

const parenthesizedType: P.Parser<M.Type> = P.fold([C.char('('), S.spaces]).applySecond(
  unparenthesizedType.applyFirst(P.fold([S.spaces, C.char(')')]))
)

export const type: P.Parser<M.Type> = expected('a type', parenthesizedType.alt(unparenthesizedType))

const comma = P.fold([S.spaces, C.char(','), S.spaces])

const pair: P.Parser<[string, M.Type]> = identifier.chain(name =>
  P.fold([S.spaces, S.string('::'), S.spaces])
    .applySecond(type)
    .map(type => tuple(name, type))
)

const recordMembers: P.Parser<Array<M.Member>> = P.fold([C.char('{'), S.spaces])
  .applySecond(P.sepBy(comma, pair).map(ps => ps.map(([name, type]) => M.member(type, some(name)))))
  .applyFirst(P.fold([S.spaces, C.char('}')]))

const positionalMember: P.Parser<M.Member> = parenthesizedType.alt(singletonType).map(type => M.member(type))

const positionalMembers: P.Parser<Array<M.Member>> = P.sepBy(S.spaces, positionalMember)

const members = recordMembers.alt(positionalMembers).alt(P.failWith('invalid constructor members'))

export const constructor: P.Parser<M.Constructor> = identifier.chain(name =>
  S.spaces.applySecond(members.map(members => M.constructor(name, members)))
)

const equal = P.fold([S.spaces, C.char('='), S.spaces])

const parameterWithoutConstraint: P.Parser<M.Parameter> = identifier.map(name => M.parameter(name))

const parameterWithConstraint: P.Parser<M.Parameter> = P.fold([C.char('('), S.spaces]).applySecond(
  pair.map(([name, type]) => M.parameter(name, some(type))).applyFirst(P.fold([S.spaces, C.char(')')]))
)

export const parameter = expected('a parameter', parameterWithoutConstraint.alt(parameterWithConstraint))

export const introduction: P.Parser<M.Introduction> = expected(
  'a data type declaration',
  S.string('data').chain(() =>
    S.spaces.applySecond(
      identifier.chain(name =>
        S.spaces
          .applySecond(P.sepBy(S.spaces, parameter))
          .map(parameters => M.introduction(name, parameters))
          .applyFirst(equal)
      )
    )
  )
)

const pipe = P.fold([S.spaces, C.char('|'), S.spaces])

export const data: P.Parser<M.Data> = expected(
  'a data declaration',
  introduction
    .chain(definition =>
      P.sepBy1(pipe, constructor).map(constructors => M.data(definition, constructors.head, constructors.tail))
    )
    .applyFirst(S.spaces)
    .applyFirst(P.eof)
)

export const parse = (s: string): Either<string, M.Data> => {
  return data.run(s).bimap(e => e.message, ([data]) => data)
}
