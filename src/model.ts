import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option, none } from 'fp-ts/lib/Option'

export type Identifier = string

interface Ref {
  readonly kind: 'Ref'
  readonly name: Identifier
  readonly parameters: Array<Type>
}

interface Tuple {
  readonly kind: 'Tuple'
  readonly types: Array<Type>
}

interface Fun {
  readonly kind: 'Fun'
  readonly domain: Type
  readonly codomain: Type
}

interface Unit {
  readonly kind: 'Unit'
}

export type Type = Ref | Tuple | Fun | Unit

export interface Member {
  readonly type: Type
  readonly name: Option<Identifier>
}

export interface Constructor {
  readonly name: Identifier
  readonly members: Array<Member>
}

export interface ParameterDeclaration {
  readonly name: Identifier
  readonly constraint: Option<Type>
}

export interface Data {
  readonly name: Identifier
  readonly parameterDeclarations: Array<ParameterDeclaration>
  readonly constructors: NonEmptyArray<Constructor>
}

export const ref = (name: Identifier, parameters: Array<Type> = []): Type => ({
  kind: 'Ref',
  name,
  parameters
})

export const tuple = (types: Array<Type>): Type => ({
  kind: 'Tuple',
  types
})

export const unit: Type = { kind: 'Unit' }

export const fun = (domain: Type, codomain: Type): Type => ({
  kind: 'Fun',
  domain,
  codomain
})

export const member = (type: Type, name: Option<Identifier> = none): Member => ({
  type,
  name
})

export const constructor = (name: Identifier, members: Array<Member> = []): Constructor => ({
  name,
  members
})

export const parameterDeclaration = (name: Identifier, constraint: Option<Type> = none): ParameterDeclaration => ({
  name,
  constraint
})

export const data = (
  name: Identifier,
  parameterDeclarations: Array<ParameterDeclaration>,
  head: Constructor,
  tail: Array<Constructor> = []
): Data => ({
  name,
  parameterDeclarations,
  constructors: new NonEmptyArray(head, tail)
})
