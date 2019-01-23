import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { Option, none } from 'fp-ts/lib/Option'

export type Identifier = string

export interface Type {
  name: Identifier
  parameters: Array<Type>
}

export interface Member {
  type: Type
  name: Option<Identifier>
}

export interface Constructor {
  name: Identifier
  members: Array<Member>
}

export interface Parameter {
  name: Identifier
  constraint: Option<Type>
}

export interface Introduction {
  name: Identifier
  parameters: Array<Parameter>
}

export interface Data {
  introduction: Introduction
  constructors: NonEmptyArray<Constructor>
}

export const type = (name: Identifier, parameters: Array<Type> = []): Type => ({
  name,
  parameters
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

export const data = (introduction: Introduction, head: Constructor, tail: Array<Constructor>): Data => ({
  introduction,
  constructors: new NonEmptyArray(head, tail)
})
