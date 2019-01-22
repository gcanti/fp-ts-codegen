import * as assert from 'assert'
import { Parser } from 'parser-ts'
import * as P from '../src/parser'
import * as M from '../src/model'
import * as H from './helpers'
import { right, left } from 'fp-ts/lib/Either'

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
    assertFailure(parser, '', 'Expected an identifier, got ""')
    assertFailure(parser, '1', 'Expected an identifier, got "1"')
  })

  it('type', () => {
    const parser = P.type
    assertSuccess(parser, 'A', M.type('A', []))
    assertSuccess(parser, '(A)', M.type('A', []))
    assertSuccess(parser, 'A ', M.type('A', []))
    assertSuccess(parser, 'A1', M.type('A1', []))
    assertSuccess(parser, 'A\n', M.type('A', []))
    assertSuccess(parser, '(Some A)', M.type('Some', [M.type('A', [])]))
    assertSuccess(parser, '(Tree A)', M.type('Tree', [M.type('A', [])]))
    assertSuccess(parser, '(Tree A)', M.type('Tree', [M.type('A', [])]))
    assertFailure(parser, '', 'Expected an identifier, got ""')
    assertFailure(parser, '1', 'Expected an identifier, got "1"')
  })

  it('members', () => {
    const parser = P.members
    assertSuccess(parser, '(Tree A) A', [
      M.positionalMember(M.type('Tree', [M.type('A')])),
      M.positionalMember(M.type('A'))
    ])
    assertSuccess(parser, 'A (Tree A)', [
      M.positionalMember(M.type('A')),
      M.positionalMember(M.type('Tree', [M.type('A')]))
    ])
    assertSuccess(parser, '(Tree A) A (Tree A)', [
      M.positionalMember(M.type('Tree', [M.type('A')])),
      M.positionalMember(M.type('A')),
      M.positionalMember(M.type('Tree', [M.type('A')]))
    ])
  })

  it('constructor', () => {
    const parser = P.constructor
    assertSuccess(parser, 'None', H.None)
    assertSuccess(parser, 'Some A', H.Some)
    assertSuccess(parser, 'Node (Tree A) A (Tree A)', H.Node)
  })

  it('introduction', () => {
    const parser = P.introduction
    assertSuccess(parser, 'data Option A = ', M.introduction('Option', ['A']))
  })

  it('data', () => {
    const parser = P.data
    assertSuccess(parser, 'data Option A = None | Some A', H.Option)
    assertSuccess(parser, 'data Either L A = Left L | Right A', H.Either)
    assertSuccess(parser, 'data Tree A = Leaf | Node (Tree A) A (Tree A)', H.Tree)
    assertSuccess(parser, 'data Maybe A = Nothing | Just value:A', H.Maybe)
  })

  it('parse', () => {
    assert.deepStrictEqual(P.parse('data Option A = None | Some A'), right(H.Option))
    assert.deepStrictEqual(P.parse('data Option A = '), left('Expected an identifier, got ""'))
  })
})
