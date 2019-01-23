import * as M from '../src/model'
import { some } from 'fp-ts/lib/Option'

// None
export const None = M.constructor('None')

// Some A
export const Some = M.constructor('Some', [M.member(M.type('A'))])

// Node (Tree A) A (Tree A)
export const Node = M.constructor('Node', [
  M.member(M.type('Tree', [M.type('A')])),
  M.member(M.type('A')),
  M.member(M.type('Tree', [M.type('A')]))
])

// data Option A = None | Some A
export const Option = M.data(M.introduction('Option', [M.parameter('A')]), None, [Some])

// data Maybe A = Nothing | Just value:A
export const Maybe = M.data(M.introduction('Maybe', [M.parameter('A')]), M.constructor('Nothing'), [
  M.constructor('Just', [M.member(M.type('A'), some('value'))])
])

// data Either L A = Left L | Right A
export const Either = M.data(
  M.introduction('Either', [M.parameter('L'), M.parameter('R')]),
  M.constructor('Left', [M.member(M.type('L'))]),
  [M.constructor('Right', [M.member(M.type('R'))])]
)

// data Tree A = Leaf | Node (Tree A) A (Tree A)
export const Tree = M.data(M.introduction('Tree', [M.parameter('A')]), M.constructor('Leaf'), [Node])

// data FooBar = Foo | Bar
export const FooBar = M.data(M.introduction('FooBar'), M.constructor('Foo'), [M.constructor('Bar')])

// data User = User { name :: string, surname :: string }
export const User = M.data(
  M.introduction('User'),
  M.constructor('User', [M.member(M.type('string'), some('name')), M.member(M.type('string'), some('surname'))]),
  []
)

// data Constrained (A :: string) = Fetching | GotData A
export const Constrained = M.data(
  M.introduction('Constrained', [M.parameter('A', some(M.type('string')))]),
  M.constructor('Fetching'),
  [M.constructor('GotData', [M.member(M.type('A'))])]
)
