import * as assert from 'assert'
import { Parser } from 'parser-ts'
import * as P from '../src/parser'
import * as M from '../src/model'
import * as H from './helpers'
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
    assertFailure(parser, '', 'Expected an identifier, got ""')
    assertFailure(parser, '1', 'Expected an identifier, got "1"')
  })

  it('parameter', () => {
    const parser = P.parameter
    assertSuccess(parser, 'A', M.parameter('A'))
    assertSuccess(parser, '(A :: string)', M.parameter('A', some(M.type('string'))))
    assertSuccess(parser, '( A :: string )', M.parameter('A', some(M.type('string'))))
    assertFailure(parser, '(A)', 'Expected a constrained parameter, got ")"')
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
    assertFailure(parser, '', 'Expected an identifier, got ""')
    assertFailure(parser, '1', 'Expected an identifier, got "1"')
  })

  it('members', () => {
    const parser = P.members
    assertSuccess(parser, '(Tree A) A', [M.member(M.type('Tree', [M.type('A')])), M.member(M.type('A'))])
    assertSuccess(parser, 'A (Tree A)', [M.member(M.type('A')), M.member(M.type('Tree', [M.type('A')]))])
    assertSuccess(parser, '(Tree A) A (Tree A)', [
      M.member(M.type('Tree', [M.type('A')])),
      M.member(M.type('A')),
      M.member(M.type('Tree', [M.type('A')]))
    ])
    assertSuccess(parser, '{ foo :: string }', [M.member(M.type('string'), some('foo'))])
    assertSuccess(parser, '{ foo :: string, bar :: number }', [
      M.member(M.type('string'), some('foo')),
      M.member(M.type('number'), some('bar'))
    ])
    assertSuccess(parser, '{foo::string,bar::number}', [
      M.member(M.type('string'), some('foo')),
      M.member(M.type('number'), some('bar'))
    ])
    assertSuccess(parser, '{ xs :: (Array boolean) }', [M.member(M.type('Array', [M.type('boolean')]), some('xs'))])
    assertSuccess(parser, '{ xs :: Array boolean }', [M.member(M.type('Array', [M.type('boolean')]), some('xs'))])
  })

  it('constructor', () => {
    const parser = P.constructor
    assertSuccess(parser, 'None', H.None)
    assertSuccess(parser, 'Some A', H.Some)
    assertSuccess(parser, 'Node (Tree A) A (Tree A)', H.Node)
  })

  it('introduction', () => {
    const parser = P.introduction
    assertSuccess(parser, 'data Option A = ', M.introduction('Option', [M.parameter('A')]))
  })

  it('data', () => {
    const parser = P.data
    assertSuccess(parser, 'data Option A = None | Some A', H.Option)
    assertSuccess(parser, 'data Either L R = Left L | Right R', H.Either)
    assertSuccess(parser, 'data Tree A = Leaf | Node (Tree A) A (Tree A)', H.Tree)
    assertSuccess(parser, 'data User = User { name :: string, surname :: string }', H.User)
  })

  it('parse', () => {
    assert.deepStrictEqual(P.parse('data Option A = None | Some A'), right(H.Option))
    assert.deepStrictEqual(P.parse('data Option A = '), left('Expected an identifier, got ""'))
  })
})
