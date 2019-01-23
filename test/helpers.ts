import * as M from '../src/model'
import { some } from 'fp-ts/lib/Option'

// None
export const None = M.constructor('None')

// Some A
export const Some = M.constructor('Some', [M.positionalMember(M.type('A'))])

// Node (Tree A) A (Tree A)
export const Node = M.constructor('Node', [
  M.positionalMember(M.type('Tree', [M.type('A')])),
  M.positionalMember(M.type('A')),
  M.positionalMember(M.type('Tree', [M.type('A')]))
])

// data Option A = None | Some A
export const Option = M.data(M.introduction('Option', [M.parameter('A')]), None, [Some])

// data Maybe A = Nothing | Just value:A
export const Maybe = M.data(M.introduction('Maybe', [M.parameter('A')]), M.constructor('Nothing'), [
  M.constructor('Just', [M.namedMember('value', M.type('A'))])
])

// data Either L A = Left L | Right A
export const Either = M.data(
  M.introduction('Either', [M.parameter('L'), M.parameter('R')]),
  M.constructor('Left', [M.positionalMember(M.type('L'))]),
  [M.constructor('Right', [M.positionalMember(M.type('R'))])]
)

// data Tree A = Leaf | Node (Tree A) A (Tree A)
export const Tree = M.data(M.introduction('Tree', [M.parameter('A')]), M.constructor('Leaf'), [Node])

// data FooBar = Foo | Bar
export const FooBar = M.data(M.introduction('FooBar'), M.constructor('Foo'), [M.constructor('Bar')])

// data User = User name:string surname:string
export const User = M.data(
  M.introduction('User'),
  M.constructor('User', [M.namedMember('name', M.type('string')), M.namedMember('surname', M.type('string'))]),
  []
)

// data Constrained (A :: string) = Fetching | GotData A
export const Constrained = M.data(
  M.introduction('Constrained', [M.parameter('A', some(M.type('string')))]),
  M.constructor('Fetching'),
  [M.constructor('GotData', [M.positionalMember(M.type('A'))])]
)
