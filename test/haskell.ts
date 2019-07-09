import * as assert from 'assert'
import { parser, char as C, stream } from 'parser-ts'
import * as P from '../src/haskell'
import * as M from '../src/model'
import * as E from './examples'
import { right, left, isRight, isLeft } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'
import { head } from 'fp-ts/lib/NonEmptyArray'

const assertSuccess = <A>(parser: parser.Parser<C.Char, A>, input: string, expected: A) => {
  const result = parser(stream.stream(input.split('')))
  if (isRight(result)) {
    assert.deepStrictEqual(result.right.value, expected)
  } else {
    throw new Error(`${result} is not a right`)
  }
}

const assertFailure = <A>(parser: parser.Parser<C.Char, A>, input: string, expected: string) => {
  const result = parser(stream.stream(input.split('')))
  if (isLeft(result)) {
    assert.deepStrictEqual(result.left.expected.join(', '), expected)
  } else {
    throw new Error(`${result} is not a left`)
  }
}

describe('Haskell parser', () => {
  it('identifier', () => {
    const parser = P.identifier
    assertSuccess(parser, 'a', 'a')
    assertSuccess(parser, 'a1', 'a1')
    assertSuccess(parser, 'a\n', 'a')
    assertSuccess(parser, 'a:b', 'a')
    assertFailure(parser, '', 'an identifier')
    assertFailure(parser, '1', 'an identifier')
  })

  it('parameterDeclaration', () => {
    const parser = P.parameterDeclaration
    assertSuccess(parser, 'A', M.parameterDeclaration('A'))
    assertSuccess(parser, '(A :: string)', M.parameterDeclaration('A', some(M.ref('string'))))
    assertSuccess(parser, '( A :: string )', M.parameterDeclaration('A', some(M.ref('string'))))
    assertFailure(parser, '(A)', 'a parameter')
    assertFailure(parser, '(A :: )', 'a parameter')
  })

  it('tuple', () => {
    const parser = P.tuple
    assertSuccess(parser, '(A, B)', M.tuple([M.ref('A'), M.ref('B')]))
    assertSuccess(parser, '()', M.unit)
    assertSuccess(parser, '(A)', M.ref('A'))
    assertFailure(parser, '(A,)', 'a tuple')
  })

  it('functionType', () => {
    const parser = P.fun
    assertSuccess(parser, 'A -> B', M.fun(M.ref('A'), M.ref('B')))
    assertSuccess(parser, 'A -> B -> C', M.fun(M.ref('A'), M.fun(M.ref('B'), M.ref('C'))))
    assertSuccess(parser, '(A -> B) -> C', M.fun(M.fun(M.ref('A'), M.ref('B')), M.ref('C')))
    assertFailure(parser, 'A -> ', 'a function type')
  })

  it('type', () => {
    const parser = P.type
    // type references
    assertSuccess(parser, 'T', M.ref('T'))
    assertSuccess(parser, 'T A', M.ref('T', [M.ref('A')]))
    assertSuccess(parser, 'T A B', M.ref('T', [M.ref('A'), M.ref('B')]))
    assertSuccess(parser, 'T ', M.ref('T'))
    assertSuccess(parser, 'T1', M.ref('T1'))
    assertSuccess(parser, 'T\n', M.ref('T'))
    assertSuccess(parser, 'T (A)', M.ref('T', [M.ref('A')]))
    assertSuccess(parser, 'T A (B)', M.ref('T', [M.ref('A'), M.ref('B')]))
    assertSuccess(parser, 'T (A B)', M.ref('T', [M.ref('A', [M.ref('B')])]))
    // tuples
    assertSuccess(parser, '(A, B)', M.tuple([M.ref('A'), M.ref('B')]))
    assertSuccess(parser, '(A, B, C)', M.tuple([M.ref('A'), M.ref('B'), M.ref('C')]))
    assertSuccess(parser, '(A, B, C D)', M.tuple([M.ref('A'), M.ref('B'), M.ref('C', [M.ref('D')])]))
    assertSuccess(parser, 'T (A, B)', M.ref('T', [M.tuple([M.ref('A'), M.ref('B')])]))
    // functions
    assertSuccess(parser, 'A -> B', M.fun(M.ref('A'), M.ref('B')))
    assertSuccess(parser, '(A, B) -> C', M.fun(M.tuple([M.ref('A'), M.ref('B')]), M.ref('C')))
    assertSuccess(parser, 'A -> (B, C)', M.fun(M.ref('A'), M.tuple([M.ref('B'), M.ref('C')])))
    assertSuccess(parser, 'T A -> B', M.ref('T', [M.fun(M.ref('A'), M.ref('B'))]))
    assertSuccess(parser, 'A -> B -> C', M.fun(M.ref('A'), M.fun(M.ref('B'), M.ref('C'))))
    assertSuccess(parser, '(A -> B) -> C', M.fun(M.fun(M.ref('A'), M.ref('B')), M.ref('C')))
  })

  it('type with parens', () => {
    const parser = P.type
    // type references
    assertSuccess(parser, '(T)', M.ref('T'))
    assertSuccess(parser, '( T )', M.ref('T'))
    // tuples
    // functions
    assertSuccess(parser, '(A -> B)', M.fun(M.ref('A'), M.ref('B')))
    assertSuccess(parser, 'T (A -> B)', M.ref('T', [M.fun(M.ref('A'), M.ref('B'))]))
    assertSuccess(parser, 'A -> (B -> C)', M.fun(M.ref('A'), M.fun(M.ref('B'), M.ref('C'))))
  })

  it('constructor', () => {
    const parser = P.constructor
    // type references
    assertSuccess(parser, 'None', head(E.Option.constructors))
    assertSuccess(parser, 'Some A', E.Option.constructors[1])
    assertSuccess(parser, 'Some (A)', E.Option.constructors[1])
    assertSuccess(parser, 'T A B', M.constructor('T', [M.member(M.ref('A')), M.member(M.ref('B'))]))
    assertSuccess(parser, 'T (A) B', M.constructor('T', [M.member(M.ref('A')), M.member(M.ref('B'))]))
    assertSuccess(parser, 'T (A B)', M.constructor('T', [M.member(M.ref('A', [M.ref('B')]))]))
    assertSuccess(parser, 'Node (Tree A) A (Tree A)', E.Tree.constructors[1])
    assertSuccess(parser, 'User { name :: string, surname :: string, age :: number }', head(E.User.constructors))
    // tuples
    assertSuccess(parser, 'Tuple2 (A, B)', head(E.Tuple2.constructors))
    // functions
    assertSuccess(parser, 'State S -> (A, S)', head(E.State.constructors))
  })

  it('data', () => {
    const parser = P.data
    // type references
    assertSuccess(parser, 'data Option A = None | Some A', E.Option)
    assertSuccess(parser, 'data Either E R = Left E | Right R', E.Either)
    assertSuccess(parser, 'data Tree A = Leaf | Node (Tree A) A (Tree A)', E.Tree)
    assertSuccess(parser, 'data User = User { name :: string, surname :: string, age :: number }', E.User)
    // tuples
    assertSuccess(parser, 'data Tuple2 A B = Tuple2 (A, B)', E.Tuple2)
    assertFailure(
      parser,
      'data User = User { name :: string, age :: number, tags :: [number, number] }',
      'a data declaration'
    )
    // functions
    assertSuccess(parser, 'data State S A = State S -> (A, S)', E.State)
  })

  it('parse', () => {
    assert.deepStrictEqual(P.parse('data Option A = None | Some A'), right(E.Option))
    assert.deepStrictEqual(
      P.parse('data Option A = '),
      left(
        `> 1 | data Option A = ` +
          `
    |                 ^ Expected: a data declaration`
      )
    )
  })
})
