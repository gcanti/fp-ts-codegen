import * as P from 'parser-ts'
import * as S from 'parser-ts/lib/string'
import * as C from 'parser-ts/lib/char'
import * as M from './model'
import { Either } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'

const isDigit = (c: string): boolean => '0123456789'.indexOf(c) !== -1

const isPunctuation = (c: string): boolean => '| =\n():,{};[]->'.indexOf(c) !== -1

const identifierFirstLetter = P.sat(c => !isDigit(c) && !isPunctuation(c))

const identifierBody = P.sat(c => !isPunctuation(c))

const expected = <A>(message: string, parser: P.Parser<A>): P.Parser<A> =>
  P.expectedL(parser, remaining => `Expected ${message}, cannot parse ${JSON.stringify(remaining)}`)

export const identifier: P.Parser<string> = expected(
  'an identifier',
  P.fold([identifierFirstLetter, C.many(identifierBody)])
)

const leftParens: P.Parser<string> = P.fold([C.char('('), S.spaces])

const rightParens: P.Parser<string> = P.fold([S.spaces, C.char(')')])

const withParens = <A>(parser: P.Parser<A>): P.Parser<A> => {
  return leftParens.applySecond(parser).applyFirst(rightParens)
}

const unparametrizedRef: P.Parser<M.Type> = identifier.map(name => M.ref(name))

export const ref: P.Parser<M.Type> = identifier.chain(name =>
  S.spaces.applySecond(types.map(parameters => M.ref(name, parameters)))
)

const comma = P.fold([S.spaces, C.char(','), S.spaces])

export const tuple: P.Parser<M.Type> = expected(
  'a tuple',
  leftParens
    .chain(() =>
      P.sepBy(comma, type).map(types => {
        switch (types.length) {
          case 0:
            return M.unit
          case 1:
            return types[0]
          default:
            return M.tuple(types)
        }
      })
    )
    .applyFirst(rightParens)
)

const arrow = P.fold([S.spaces, S.string('->'), S.spaces])

export const fun: P.Parser<M.Type> = expected(
  'a function type',
  S.spaces.chain(() => ref.alt(tuple).chain(domain => arrow.applySecond(type).map(codomain => M.fun(domain, codomain))))
)

export const type: P.Parser<M.Type> = fun.alt(ref).alt(tuple)

export const types: P.Parser<Array<M.Type>> = P.sepBy(
  S.spaces,
  fun
    .alt(unparametrizedRef)
    .alt(withParens(ref))
    .alt(tuple)
)

const pair: P.Parser<{ name: string; type: M.Type }> = identifier.chain(name =>
  P.fold([S.spaces, S.string('::'), S.spaces])
    .applySecond(type)
    .map(type => ({ name, type }))
)

const pairs: P.Parser<Array<{ name: string; type: M.Type }>> = P.fold([C.char('{'), S.spaces])
  .applySecond(P.sepBy(comma, pair))
  .applyFirst(P.fold([S.spaces, C.char('}')]))

const recordConstructor: P.Parser<M.Constructor> = identifier.chain(name =>
  S.spaces.applySecond(
    pairs.map(pairs => M.constructor(name, pairs.map(({ name, type }) => M.member(type, some(name)))))
  )
)

const positionalConstructor: P.Parser<M.Constructor> = identifier.chain(name =>
  S.spaces.applySecond(types.map(types => M.constructor(name, types.map(type => M.member(type)))))
)

export const constructor: P.Parser<M.Constructor> = recordConstructor.alt(positionalConstructor)

const equal = P.fold([S.spaces, C.char('='), S.spaces])

const unconstrainedParameterDeclaration: P.Parser<M.ParameterDeclaration> = identifier.map(name =>
  M.parameterDeclaration(name)
)

const constrainedParameterDeclaration: P.Parser<M.ParameterDeclaration> = P.fold([C.char('('), S.spaces]).applySecond(
  pair.map(({ name, type }) => M.parameterDeclaration(name, some(type))).applyFirst(P.fold([S.spaces, C.char(')')]))
)

export const parameterDeclaration = expected(
  'a parameter',
  unconstrainedParameterDeclaration.alt(constrainedParameterDeclaration)
)

const pipe = P.fold([S.spaces, C.char('|'), S.spaces])

export const data: P.Parser<M.Data> = expected(
  'a data declaration',
  S.string('data').chain(() =>
    S.spaces.applySecond(
      identifier.chain(name =>
        S.spaces
          .applySecond(P.sepBy(S.spaces, parameterDeclaration))
          .applyFirst(equal)
          .chain(typeParameters =>
            P.sepBy1(pipe, constructor)
              .map(constructors => M.data(name, typeParameters, constructors.head, constructors.tail))
              .applyFirst(S.spaces)
              .applyFirst(P.eof)
          )
      )
    )
  )
)

export const parse = (s: string): Either<string, M.Data> => {
  return data.run(s).bimap(e => e.message, ([data]) => data)
}
