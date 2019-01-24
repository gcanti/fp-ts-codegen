import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option, none } from 'fp-ts/lib/Option'

export type Identifier = string

interface TypeReference {
  readonly kind: 'TypeReference'
  readonly name: Identifier
  readonly parameters: Array<Type>
}

interface TupleType {
  readonly kind: 'TupleType'
  readonly fst: Type
  readonly snd: Type
  readonly other: Array<Type>
}

interface FunctionType {
  readonly kind: 'FunctionType'
  readonly domain: Type
  readonly codomain: Type
}

export type Type = TypeReference | TupleType | FunctionType

export interface Member {
  readonly type: Type
  readonly name: Option<Identifier>
}

export interface Constructor {
  readonly name: Identifier
  readonly members: Array<Member>
}

export interface Parameter {
  readonly name: Identifier
  readonly constraint: Option<Type>
}

export interface Introduction {
  readonly name: Identifier
  readonly parameters: Array<Parameter>
}

export interface Data {
  readonly introduction: Introduction
  readonly constructors: NonEmptyArray<Constructor>
}

export const typeReference = (name: Identifier, parameters: Array<Type> = []): Type => ({
  kind: 'TypeReference',
  name,
  parameters
})

export const tupleType = (fst: Type, snd: Type, other: Array<Type> = []): Type => ({
  kind: 'TupleType',
  fst,
  snd,
  other
})

export const functionType = (domain: Type, codomain: Type): Type => ({
  kind: 'FunctionType',
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

export const parameter = (name: Identifier, constraint: Option<Type> = none): Parameter => ({
  name,
  constraint
})

export const introduction = (name: Identifier, parameters: Array<Parameter> = []): Introduction => ({
  name,
  parameters
})

export const data = (introduction: Introduction, head: Constructor, tail: Array<Constructor> = []): Data => ({
  introduction,
  constructors: new NonEmptyArray(head, tail)
})
