import * as M from '../src/model'
import { some } from 'fp-ts/lib/Option'

// data Option A = None | Some A
export const Option = M.data(M.introduction('Option', [M.parameter('A')]), M.constructor('None'), [
  M.constructor('Some', [M.member(M.typeReference('A'))])
])

// data Maybe A = Nothing | Just value:A
export const Maybe = M.data(M.introduction('Maybe', [M.parameter('A')]), M.constructor('Nothing'), [
  M.constructor('Just', [M.member(M.typeReference('A'), some('value'))])
])

// data Either L R = Left L | Right R
export const Either = M.data(
  M.introduction('Either', [M.parameter('L'), M.parameter('R')]),
  M.constructor('Left', [M.member(M.typeReference('L'))]),
  [M.constructor('Right', [M.member(M.typeReference('R'))])]
)

// data Tree A = Leaf | Node (Tree A) A (Tree A)
export const Tree = M.data(M.introduction('Tree', [M.parameter('A')]), M.constructor('Leaf'), [
  M.constructor('Node', [
    M.member(M.typeReference('Tree', [M.typeReference('A')])),
    M.member(M.typeReference('A')),
    M.member(M.typeReference('Tree', [M.typeReference('A')]))
  ])
])

// data FooBar = Foo | Bar
export const FooBar = M.data(M.introduction('FooBar'), M.constructor('Foo'), [M.constructor('Bar')])

// data User = User { name :: string, surname :: string }
export const User = M.data(
  M.introduction('User'),
  M.constructor('User', [
    M.member(M.typeReference('string'), some('name')),
    M.member(M.typeReference('string'), some('surname'))
  ]),
  []
)

// data Constrained (A :: string) = Fetching | GotData A
export const Constrained = M.data(
  M.introduction('Constrained', [M.parameter('A', some(M.typeReference('string')))]),
  M.constructor('Fetching'),
  [M.constructor('GotData', [M.member(M.typeReference('A'))])]
)

// data Tuple2 A B = Tuple2 (A, B)
export const Tuple2 = M.data(
  M.introduction('Tuple2', [M.parameter('A'), M.parameter('B')]),
  M.constructor('Tuple2', [M.member(M.tupleType(M.typeReference('A'), M.typeReference('B')))])
)

// data State S A = State S -> (A, S)
export const State = M.data(
  M.introduction('State', [M.parameter('S'), M.parameter('A')]),
  M.constructor('State', [
    M.member(M.functionType(M.typeReference('S'), M.tupleType(M.typeReference('A'), M.typeReference('S'))))
  ])
)
