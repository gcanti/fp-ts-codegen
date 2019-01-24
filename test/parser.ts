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
    assertSuccess(parser, '(A :: string)', M.parameter('A', some(M.type('string'))))
    assertSuccess(parser, '( A :: string )', M.parameter('A', some(M.type('string'))))
    assertFailure(parser, '(A)', 'Expected a parameter, cannot parse ")"')
  })

  it('type', () => {
    const parser = P.type
    assertSuccess(parser, 'A', M.type('A', []))
    assertSuccess(parser, '(A)', M.type('A', []))
    assertSuccess(parser, '( A )', M.type('A', []))
    assertSuccess(parser, 'A ', M.type('A', []))
    assertSuccess(parser, 'A1', M.type('A1', []))
    assertSuccess(parser, 'A\n', M.type('A', []))
    assertSuccess(parser, '(Some A)', M.type('Some', [M.type('A', [])]))
    assertSuccess(parser, '(Tree A)', M.type('Tree', [M.type('A', [])]))
    assertSuccess(parser, '(Tree A)', M.type('Tree', [M.type('A', [])]))
    assertSuccess(parser, '( Tree A )', M.type('Tree', [M.type('A', [])]))
    assertFailure(parser, '', 'Expected a type, cannot parse ""')
    assertFailure(parser, '1', 'Expected a type, cannot parse "1"')
  })

  it('constructor', () => {
    const parser = P.constructor
    assertSuccess(parser, 'None', E.Option.constructors.head)
    assertSuccess(parser, 'Some A', E.Option.constructors.tail[0])
    assertSuccess(parser, 'Node (Tree A) A (Tree A)', E.Tree.constructors.tail[0])
    assertSuccess(parser, 'User { name :: string, surname :: string }', E.User.constructors.head)
  })

  it('introduction', () => {
    const parser = P.introduction
    assertSuccess(parser, 'data Option A = ', M.introduction('Option', [M.parameter('A')]))
  })

  it('data', () => {
    const parser = P.data
    assertSuccess(parser, 'data Option A = None | Some A', E.Option)
    assertSuccess(parser, 'data Either L R = Left L | Right R', E.Either)
    assertSuccess(parser, 'data Tree A = Leaf | Node (Tree A) A (Tree A)', E.Tree)
    assertSuccess(parser, 'data User = User { name :: string, surname :: string }', E.User)
    assertFailure(
      parser,
      'data User = User { name :: string, age :: number, tags :: [number, number] }',
      'Expected a data declaration, cannot parse "{ name :: string, age :: number, tags :: [number, number] }"'
    )
  })

  it('parse', () => {
    assert.deepStrictEqual(P.parse('data Option A = None | Some A'), right(E.Option))
    assert.deepStrictEqual(P.parse('data Option A = '), left('Expected a data declaration, cannot parse ""'))
  })
})
