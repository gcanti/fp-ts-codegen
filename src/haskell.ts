import { parser as P, string as S, char as C } from 'parser-ts'
import * as M from './model'
import { Either } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import { run } from 'parser-ts/lib/code-frame'

const isDigit = (c: string): boolean => '0123456789'.indexOf(c) !== -1

const isPunctuation = (c: string): boolean => '| =\n():,{};[]->'.indexOf(c) !== -1

const identifierFirstLetter = P.sat<C.Char>(c => !isDigit(c) && !isPunctuation(c))

const identifierBody = P.sat<C.Char>(c => !isPunctuation(c))

/**
 * @since 0.4.0
 */
export const identifier: P.Parser<C.Char, string> = P.expected(
  S.fold([identifierFirstLetter, C.many(identifierBody)]),
  'an identifier'
)

const leftParens: P.Parser<C.Char, string> = S.fold([C.char('('), S.spaces])

const rightParens: P.Parser<C.Char, string> = S.fold([S.spaces, C.char(')')])

const withParens = <A>(parser: P.Parser<C.Char, A>): P.Parser<C.Char, A> => {
  return pipe(
    leftParens,
    P.apSecond(parser),
    P.apFirst(rightParens)
  )
}

const unparametrizedRef: P.Parser<C.Char, M.Type> = pipe(
  identifier,
  P.map(name => M.ref(name))
)

/**
 * @since 0.4.0
 */
export const ref: P.Parser<C.Char, M.Type> = pipe(
  identifier,
  P.chain(name =>
    pipe(
      S.spaces,
      P.apSecond(
        pipe(
          types,
          P.map(parameters => M.ref(name, parameters))
        )
      )
    )
  )
)

const comma = S.fold([S.spaces, C.char(','), S.spaces])

/**
 * @since 0.4.0
 */
export const tuple: P.Parser<C.Char, M.Type> = P.expected(
  pipe(
    leftParens,
    P.chain(() =>
      pipe(
        P.sepBy(comma, type),
        P.map(types => {
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
    ),
    P.apFirst(rightParens)
  ),
  'a tuple'
)

const arrow = S.fold([S.spaces, S.string('->'), S.spaces])

/**
 * @since 0.4.0
 */
export const fun: P.Parser<C.Char, M.Type> = P.expected(
  pipe(
    S.spaces,
    P.chain(() =>
      pipe(
        ref,
        P.alt(() => tuple),
        P.chain(domain =>
          pipe(
            arrow,
            P.apSecond(type),
            P.map(codomain => M.fun(domain, codomain))
          )
        )
      )
    )
  ),
  'a function type'
)

/**
 * @since 0.4.0
 */
export const type: P.Parser<C.Char, M.Type> = pipe(
  fun,
  P.alt(() => ref),
  P.alt(() => tuple)
)

/**
 * @since 0.4.0
 */
export const types: P.Parser<C.Char, Array<M.Type>> = P.sepBy(
  S.spaces,
  pipe(
    fun,
    P.alt(() => unparametrizedRef),
    P.alt(() => withParens(ref)),
    P.alt(() => tuple)
  )
)

const pair: P.Parser<C.Char, { name: string; type: M.Type }> = pipe(
  identifier,
  P.chain(name =>
    pipe(
      S.fold([S.spaces, S.string('::'), S.spaces]),
      P.apSecond(type),
      P.map(type => ({ name, type }))
    )
  )
)

const pairs: P.Parser<C.Char, Array<{ name: string; type: M.Type }>> = pipe(
  S.fold([C.char('{'), S.spaces]),
  P.apSecond(P.sepBy(comma, pair)),
  P.apFirst(S.fold([S.spaces, C.char('}')]))
)

const recordConstructor: P.Parser<C.Char, M.Constructor> = pipe(
  identifier,
  P.chain(name =>
    pipe(
      S.spaces,
      P.apSecond(
        pipe(
          pairs,
          P.map(pairs => M.constructor(name, pairs.map(({ name, type }) => M.member(type, some(name)))))
        )
      )
    )
  )
)

const positionalConstructor: P.Parser<C.Char, M.Constructor> = pipe(
  identifier,
  P.chain(name =>
    pipe(
      S.spaces,
      P.apSecond(
        pipe(
          types,
          P.map(types => M.constructor(name, types.map(type => M.member(type))))
        )
      )
    )
  )
)

/**
 * @since 0.4.0
 */
export const constructor: P.Parser<C.Char, M.Constructor> = pipe(
  recordConstructor,
  P.alt(() => positionalConstructor)
)

const equal = S.fold([S.spaces, C.char('='), S.spaces])

const unconstrainedParameterDeclaration: P.Parser<C.Char, M.ParameterDeclaration> = pipe(
  identifier,
  P.map(name => M.parameterDeclaration(name))
)

const constrainedParameterDeclaration: P.Parser<C.Char, M.ParameterDeclaration> = pipe(
  S.fold([C.char('('), S.spaces]),
  P.apSecond(
    pipe(
      pair,
      P.map(({ name, type }) => M.parameterDeclaration(name, some(type))),
      P.apFirst(S.fold([S.spaces, C.char(')')]))
    )
  )
)

export const parameterDeclaration = P.expected(
  pipe(
    unconstrainedParameterDeclaration,
    P.alt(() => constrainedParameterDeclaration)
  ),
  'a parameter'
)

const pipeParser = S.fold([S.spaces, C.char('|'), S.spaces])

/**
 * @since 0.4.0
 */
export const data: P.Parser<C.Char, M.Data> = P.expected(
  pipe(
    S.string('data'),
    P.chain(() =>
      pipe(
        S.spaces,
        P.apSecond(
          pipe(
            identifier,
            P.chain(name =>
              pipe(
                S.spaces,
                P.apSecond(P.sepBy(S.spaces, parameterDeclaration)),
                P.apFirst(equal),
                P.chain(typeParameters =>
                  pipe(
                    P.sepBy1(pipeParser, constructor),
                    P.map(constructors => M.data(name, typeParameters, constructors)),
                    P.apFirst(S.spaces),
                    P.apFirst(P.eof())
                  )
                )
              )
            )
          )
        )
      )
    )
  ),
  'a data declaration'
)

/**
 * @since 0.4.0
 */
export function parse(s: string): Either<string, M.Data> {
  return run(data, s)
}
