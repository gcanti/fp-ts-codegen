import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import * as M from '../src/model'

// None
export const None = M.constructor('None', [])

// Some A
export const Some = M.constructor('Some', [M.positionalMember(M.type('A'))])

// Node (Tree A) A (Tree A)
export const Node = M.constructor('Node', [
  M.positionalMember(M.type('Tree', [M.type('A')])),
  M.positionalMember(M.type('A')),
  M.positionalMember(M.type('Tree', [M.type('A')]))
])

// data Option A = None | Some A
export const Option = M.data(M.introduction('Option', ['A']), new NonEmptyArray(None, [Some]))

// data Maybe A = Nothing | Just value:A
export const Maybe = M.data(
  M.introduction('Maybe', ['A']),
  new NonEmptyArray(M.constructor('Nothing', []), [M.constructor('Just', [M.namedMember('value', M.type('A'))])])
)

// data Either L A = Left L | Right A
export const Either = M.data(
  M.introduction('Either', ['L', 'A']),
  new NonEmptyArray(M.constructor('Left', [M.positionalMember(M.type('L'))]), [
    M.constructor('Right', [M.positionalMember(M.type('A'))])
  ])
)

// data Tree A = Leaf | Node (Tree A) A (Tree A)
export const Tree = M.data(M.introduction('Tree', ['A']), new NonEmptyArray(M.constructor('Leaf', []), [Node]))

// data FooBar = Foo | Bar
export const FooBar = M.data(
  M.introduction('FooBar', []),
  new NonEmptyArray(M.constructor('Foo', []), [M.constructor('Bar', [])])
)
