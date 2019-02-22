import * as M from '../src/model'
import { some } from 'fp-ts/lib/Option'

// data Option A = None | Some A
export const Option = M.data('Option', [M.parameterDeclaration('A')], M.constructor('None'), [
  M.constructor('Some', [M.member(M.ref('A'))])
])

// data Maybe A = Nothing | Just { value :: A }
export const Maybe = M.data('Maybe', [M.parameterDeclaration('A')], M.constructor('Nothing'), [
  M.constructor('Just', [M.member(M.ref('A'), some('value'))])
])

// data Either L R = Left L | Right R
export const Either = M.data(
  'Either',
  [M.parameterDeclaration('L'), M.parameterDeclaration('R')],
  M.constructor('Left', [M.member(M.ref('L'))]),
  [M.constructor('Right', [M.member(M.ref('R'))])]
)

// data These A B = Left { left :: A } | Right { right :: B } | Both { left :: A, right :: B }
export const These = M.data(
  'These',
  [M.parameterDeclaration('A'), M.parameterDeclaration('B')],
  M.constructor('Left', [M.member(M.ref('A'), some('left'))]),
  [
    M.constructor('Right', [M.member(M.ref('B'), some('right'))]),
    M.constructor('Both', [M.member(M.ref('A'), some('left')), M.member(M.ref('B'), some('right'))])
  ]
)

// data Tree A = Leaf | Node (Tree A) A (Tree A)
export const Tree = M.data('Tree', [M.parameterDeclaration('A')], M.constructor('Leaf'), [
  M.constructor('Node', [
    M.member(M.ref('Tree', [M.ref('A')])),
    M.member(M.ref('A')),
    M.member(M.ref('Tree', [M.ref('A')]))
  ])
])

// data FooBarBaz = Foo | Bar | Baz
export const FooBarBaz = M.data('FooBarBaz', [], M.constructor('Foo'), [M.constructor('Bar'), M.constructor('Baz')])

// data User = User { name :: string, surname :: string, age :: number }
export const User = M.data(
  'User',
  [],
  M.constructor('User', [
    M.member(M.ref('string'), some('name')),
    M.member(M.ref('string'), some('surname')),
    M.member(M.ref('number'), some('age'))
  ]),
  []
)

// data Constrained (A :: string) = Fetching | GotData A
export const Constrained = M.data(
  'Constrained',
  [M.parameterDeclaration('A', some(M.ref('string')))],
  M.constructor('Fetching'),
  [M.constructor('GotData', [M.member(M.ref('A'))])]
)

// data Tuple2 A B = Tuple2 (A, B)
export const Tuple2 = M.data(
  'Tuple2',
  [M.parameterDeclaration('A'), M.parameterDeclaration('B')],
  M.constructor('Tuple2', [M.member(M.tuple([M.ref('A'), M.ref('B')]))])
)

// data State S A = State S -> (A, S)
export const State = M.data(
  'State',
  [M.parameterDeclaration('S'), M.parameterDeclaration('A')],
  M.constructor('State', [M.member(M.fun(M.ref('S'), M.tuple([M.ref('A'), M.ref('S')])))])
)

// data Writer W A = Writer () -> (A, W)
export const Writer = M.data(
  'Writer',
  [M.parameterDeclaration('W'), M.parameterDeclaration('A')],
  M.constructor('Writer', [M.member(M.fun(M.unit, M.tuple([M.ref('A'), M.ref('W')])))])
)

// data Nullary = Nullary
export const Nullary = M.data('Nullary', [], M.constructor('Nullary'))

// data NotAlignedNames = Ctor string
export const NotAlignedNames = M.data(
  'NotAlignedNames',
  [],
  M.constructor('Ctor', [M.member(M.ref('string'), some('value'))])
)
