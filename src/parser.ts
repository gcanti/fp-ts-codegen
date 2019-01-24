import * as P from 'parser-ts'
import * as S from 'parser-ts/lib/string'
import * as C from 'parser-ts/lib/char'
import * as M from './model'
import { Either } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'
import { tuple } from 'fp-ts/lib/function'

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

const typeReferenceLeaf: P.Parser<M.Type> = identifier.map(name => M.typeReference(name))

export const typeReference: P.Parser<M.Type> = identifier.chain(name =>
  S.spaces.applySecond(types.map(parameters => M.typeReference(name, parameters)))
)

const comma = P.fold([S.spaces, C.char(','), S.spaces])

const other: P.Parser<Array<M.Type>> = comma.chain(() => P.sepBy(comma, type)).alt(P.parser.of([]))

export const tupleType: P.Parser<M.Type> = expected(
  'a tuple',
  leftParens
    .chain(() =>
      type.applyFirst(comma).chain(fst => type.chain(snd => other.map(other => M.tupleType(fst, snd, other))))
    )
    .applyFirst(rightParens)
)

const arrow = P.fold([S.spaces, S.string('->'), S.spaces])

export const functionType: P.Parser<M.Type> = expected(
  'a function type',
  S.spaces.chain(() =>
    withParens(functionType)
      .alt(typeReference)
      .alt(tupleType)
      .chain(domain => arrow.applySecond(type).map(codomain => M.functionType(domain, codomain)))
  )
)

export const type: P.Parser<M.Type> = functionType.alt(typeReference).alt(tupleType)

export const types: P.Parser<Array<M.Type>> = P.sepBy(
  S.spaces,
  functionType
    .alt(typeReferenceLeaf)
    .alt(withParens(typeReference))
    .alt(tupleType)
)

const pair: P.Parser<[string, M.Type]> = identifier.chain(name =>
  P.fold([S.spaces, S.string('::'), S.spaces])
    .applySecond(type)
    .map(type => tuple(name, type))
)

const objectType: P.Parser<Array<[string, M.Type]>> = P.fold([C.char('{'), S.spaces])
  .applySecond(P.sepBy(comma, pair))
  .applyFirst(P.fold([S.spaces, C.char('}')]))

const recordConstructor: P.Parser<M.Constructor> = identifier.chain(name =>
  S.spaces.applySecond(
    objectType.map(pairs => M.constructor(name, pairs.map(([name, type]) => M.member(type, some(name)))))
  )
)

const positionalConstructor: P.Parser<M.Constructor> = identifier.chain(name =>
  S.spaces.applySecond(types.map(types => M.constructor(name, types.map(type => M.member(type)))))
)

export const constructor: P.Parser<M.Constructor> = recordConstructor.alt(positionalConstructor)

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
