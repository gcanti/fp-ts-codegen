import * as P from 'parser-ts'
import * as S from 'parser-ts/lib/string'
import * as C from 'parser-ts/lib/char'
import * as M from './model'
import { Either } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'

const isDigit = (c: string): boolean => '0123456789'.indexOf(c) !== -1

const isPunctuation = (c: string): boolean => '| =\n():'.indexOf(c) !== -1

const identifierFirstLetter = P.sat(c => !isDigit(c) && !isPunctuation(c))

const identifierBody = P.sat(c => !isPunctuation(c))

export const identifier: P.Parser<string> = P.expectedL(
  P.fold([identifierFirstLetter, C.many(identifierBody)]),
  remaining => `Expected an identifier, got ${JSON.stringify(remaining)}`
)

const typeWithoutParens: P.Parser<M.Type> = identifier.map(name => M.type(name, []))

const typeWithParens: P.Parser<M.Type> = C.char('(')
  .applySecond(S.spaces)
  .applySecond(
    identifier
      .chain(name =>
        S.spaces.applySecond(
          P.many(type)
            .applyFirst(S.spaces)
            .map(types => M.type(name, types))
        )
      )
      .applyFirst(C.char(')'))
  )

export const type: P.Parser<M.Type> = typeWithParens.alt(typeWithoutParens)

export const positionalMember: P.Parser<M.Member> = type.map(M.positionalMember)

export const namedMember: P.Parser<M.Member> = identifier.chain(name =>
  C.char(':').applySecond(type.map(type => M.namedMember(name, type)))
)

export const member: P.Parser<M.Member> = namedMember.alt(positionalMember)

export const members: P.Parser<Array<M.Member>> = P.sepBy(S.spaces, member)

export const constructor: P.Parser<M.Constructor> = identifier.chain(name =>
  S.spaces.applySecond(members.map(members => M.constructor(name, members)))
)

const equal = S.spaces.chain(() => C.char('='))

const parameterWithoutConstraint: P.Parser<M.Parameter> = identifier.map(name => M.parameter(name))

const parameterWithConstraint: P.Parser<M.Parameter> = P.expectedL(
  P.fold([C.char('('), S.spaces]).applySecond(
    identifier.chain(name =>
      P.fold([S.spaces, S.string('::'), S.spaces])
        .applySecond(type)
        .map(type => M.parameter(name, some(type)))
        .applyFirst(P.fold([S.spaces, C.char(')')]))
    )
  ),
  remaining => `Expected a constrained parameter, got ${JSON.stringify(remaining)}`
)

export const parameter = parameterWithoutConstraint.alt(parameterWithConstraint)

export const introduction: P.Parser<M.Introduction> = S.string('data').chain(() =>
  S.spaces.applySecond(
    identifier.chain(name =>
      S.spaces
        .applySecond(P.sepBy(S.spaces, parameter))
        .chain(parameters => equal.map(() => M.introduction(name, parameters)))
    )
  )
)

const pipe = P.fold([S.spaces, C.char('|'), S.spaces])

export const data: P.Parser<M.Data> = introduction.chain(definition =>
  S.spaces.applySecond(
    P.sepBy1(pipe, constructor).map(constructors => M.data(definition, constructors.head, constructors.tail))
  )
)

export const parse = (s: string): Either<string, M.Data> => {
  return data.run(s).bimap(e => e.message, ([data]) => data)
}
