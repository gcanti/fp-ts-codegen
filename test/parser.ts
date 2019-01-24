import * as assert from 'assert'
import { Parser } from 'parser-ts'
import * as P from '../src/parser'
import * as M from '../src/model'
import * as E from './examples'
import { right, left } from 'fp-ts/lib/Either'
import { some } from 'fp-ts/lib/Option'

const assertSuccess = <A>(parser: Parser<A>, input: string, expected: A) => {
  const result = parser.run(input)
  if (result.isRight()) {
    assert.deepStrictEqual(result.value[0], expected)
  } else {
    throw new Error(`${result} is not a right`)
  }
}

const assertFailure = <A>(parser: Parser<A>, input: string, expected: string) => {
  const result = parser.run(input)
  if (result.isLeft()) {
    assert.deepStrictEqual(result.value.message, expected)
  } else {
    throw new Error(`${result} is not a left`)
  }
}

describe('parser', () => {
  it('identifier', () => {
    const parser = P.identifier
    assertSuccess(parser, 'a', 'a')
    assertSuccess(parser, 'a1', 'a1')
    assertSuccess(parser, 'a\n', 'a')
    assertSuccess(parser, 'a:b', 'a')
    assertFailure(parser, '', 'Expected an identifier, cannot parse ""')
    assertFailure(parser, '1', 'Expected an identifier, cannot parse "1"')
  })

  it('parameter', () => {
    const parser = P.parameter
    assertSuccess(parser, 'A', M.parameter('A'))
    assertSuccess(parser, '(A :: string)', M.parameter('A', some(M.typeReference('string'))))
    assertSuccess(parser, '( A :: string )', M.parameter('A', some(M.typeReference('string'))))
    assertFailure(parser, '(A)', 'Expected a parameter, cannot parse ")"')
    assertFailure(parser, '(A :: )', 'Expected a parameter, cannot parse ")"')
  })

  it('tupleType', () => {
    const parser = P.tupleType
    assertSuccess(parser, '(A, B)', M.tupleType(M.typeReference('A'), M.typeReference('B')))
    assertFailure(parser, '()', 'Expected a tuple, cannot parse ")"')
    assertFailure(parser, '(A)', 'Expected a tuple, cannot parse ")"')
    assertFailure(parser, '(A,)', 'Expected a tuple, cannot parse ")"')
  })

  it('functionType', () => {
    const parser = P.functionType
    assertSuccess(parser, 'A -> B', M.functionType(M.typeReference('A'), M.typeReference('B')))
    assertSuccess(
      parser,
      'A -> B -> C',
      M.functionType(M.typeReference('A'), M.functionType(M.typeReference('B'), M.typeReference('C')))
    )
    assertSuccess(
      parser,
      '(A -> B) -> C',
      M.functionType(M.functionType(M.typeReference('A'), M.typeReference('B')), M.typeReference('C'))
    )
    assertFailure(parser, 'A -> ', 'Expected a function type, cannot parse ""')
  })

  it('type', () => {
    const parser = P.type
    // type references
    assertSuccess(parser, 'T', M.typeReference('T'))
    assertSuccess(parser, 'T A', M.typeReference('T', [M.typeReference('A')]))
    assertSuccess(parser, 'T A B', M.typeReference('T', [M.typeReference('A'), M.typeReference('B')]))
    assertSuccess(parser, 'T ', M.typeReference('T'))
    assertSuccess(parser, 'T1', M.typeReference('T1'))
    assertSuccess(parser, 'T\n', M.typeReference('T'))
    assertSuccess(parser, 'T (A)', M.typeReference('T', [M.typeReference('A')]))
    assertSuccess(parser, 'T A (B)', M.typeReference('T', [M.typeReference('A'), M.typeReference('B')]))
    assertSuccess(parser, 'T (A B)', M.typeReference('T', [M.typeReference('A', [M.typeReference('B')])]))
    // tuples
    assertSuccess(parser, '(A, B)', M.tupleType(M.typeReference('A'), M.typeReference('B')))
    assertSuccess(parser, '(A, B, C)', M.tupleType(M.typeReference('A'), M.typeReference('B'), [M.typeReference('C')]))
    assertSuccess(
      parser,
      '(A, B, C D)',
      M.tupleType(M.typeReference('A'), M.typeReference('B'), [M.typeReference('C', [M.typeReference('D')])])
    )
    assertSuccess(parser, 'T (A, B)', M.typeReference('T', [M.tupleType(M.typeReference('A'), M.typeReference('B'))]))
    // functions
    assertSuccess(parser, 'A -> B', M.functionType(M.typeReference('A'), M.typeReference('B')))
    assertSuccess(
      parser,
      '(A, B) -> C',
      M.functionType(M.tupleType(M.typeReference('A'), M.typeReference('B')), M.typeReference('C'))
    )
    assertSuccess(
      parser,
      'A -> (B, C)',
      M.functionType(M.typeReference('A'), M.tupleType(M.typeReference('B'), M.typeReference('C')))
    )
    assertSuccess(
      parser,
      'T A -> B',
      M.typeReference('T', [M.functionType(M.typeReference('A'), M.typeReference('B'))])
    )
    assertSuccess(
      parser,
      'A -> B -> C',
      M.functionType(M.typeReference('A'), M.functionType(M.typeReference('B'), M.typeReference('C')))
    )
    assertSuccess(
      parser,
      '(A -> B) -> C',
      M.functionType(M.functionType(M.typeReference('A'), M.typeReference('B')), M.typeReference('C'))
    )
  })

  it.skip('type with parens', () => {
    const parser = P.type
    // type references
    assertSuccess(parser, '(T)', M.typeReference('T'))
    assertSuccess(parser, '( T )', M.typeReference('T'))
    // tuples
    // functions
    assertSuccess(parser, '(A -> B)', M.functionType(M.typeReference('A'), M.typeReference('B')))
    assertSuccess(
      parser,
      'T (A -> B)',
      M.typeReference('T', [M.functionType(M.typeReference('A'), M.typeReference('B'))])
    )
    assertSuccess(
      parser,
      'A -> (B -> C)',
      M.functionType(M.typeReference('A'), M.functionType(M.typeReference('B'), M.typeReference('C')))
    )
  })

  it('constructor', () => {
    const parser = P.constructor
    // type references
    assertSuccess(parser, 'None', E.Option.constructors.head)
    assertSuccess(parser, 'Some A', E.Option.constructors.tail[0])
    assertSuccess(parser, 'Some (A)', E.Option.constructors.tail[0])
    assertSuccess(parser, 'T A B', M.constructor('T', [M.member(M.typeReference('A')), M.member(M.typeReference('B'))]))
    assertSuccess(
      parser,
      'T (A) B',
      M.constructor('T', [M.member(M.typeReference('A')), M.member(M.typeReference('B'))])
    )
    assertSuccess(parser, 'T (A B)', M.constructor('T', [M.member(M.typeReference('A', [M.typeReference('B')]))]))
    assertSuccess(parser, 'Node (Tree A) A (Tree A)', E.Tree.constructors.tail[0])
    assertSuccess(parser, 'User { name :: string, surname :: string }', E.User.constructors.head)
    // tuples
    assertSuccess(parser, 'Tuple2 (A, B)', E.Tuple2.constructors.head)
    // functions
    assertSuccess(parser, 'State S -> (A, S)', E.State.constructors.head)
  })

  it('introduction', () => {
    const parser = P.introduction
    assertSuccess(parser, 'data Option A = ', M.introduction('Option', [M.parameter('A')]))
  })

  it('data', () => {
    const parser = P.data
    // type references
    assertSuccess(parser, 'data Option A = None | Some A', E.Option)
    assertSuccess(parser, 'data Either L R = Left L | Right R', E.Either)
    assertSuccess(parser, 'data Tree A = Leaf | Node (Tree A) A (Tree A)', E.Tree)
    assertSuccess(parser, 'data User = User { name :: string, surname :: string }', E.User)
    // tuples
    assertSuccess(parser, 'data Tuple2 A B = Tuple2 (A, B)', E.Tuple2)
    assertFailure(
      parser,
      'data User = User { name :: string, age :: number, tags :: [number, number] }',
      'Expected a data declaration, cannot parse "{ name :: string, age :: number, tags :: [number, number] }"'
    )
    // functions
    assertSuccess(parser, 'data State S A = State S -> (A, S)', E.State)
  })

  it('parse', () => {
    assert.deepStrictEqual(P.parse('data Option A = None | Some A'), right(E.Option))
    assert.deepStrictEqual(P.parse('data Option A = '), left('Expected a data declaration, cannot parse ""'))
  })
})
