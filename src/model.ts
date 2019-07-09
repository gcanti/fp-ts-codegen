import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { none, Option } from 'fp-ts/lib/Option'

/**
 * @since 0.4.0
 */
export type Identifier = string

/**
 * @since 0.4.0
 */
export interface Ref {
  readonly kind: 'Ref'
  readonly name: Identifier
  readonly parameters: Array<Type>
}

/**
 * @since 0.4.0
 */
export interface Tuple {
  readonly kind: 'Tuple'
  readonly types: Array<Type>
}

/**
 * @since 0.4.0
 */
export interface Fun {
  readonly kind: 'Fun'
  readonly domain: Type
  readonly codomain: Type
}

/**
 * @since 0.4.0
 */
export interface Unit {
  readonly kind: 'Unit'
}

/**
 * @since 0.4.0
 */
export type Type = Ref | Tuple | Fun | Unit

/**
 * @since 0.4.0
 */
export interface Member {
  readonly type: Type
  readonly name: Option<Identifier>
}

/**
 * @since 0.4.0
 */
export interface Constructor {
  readonly name: Identifier
  readonly members: Array<Member>
}

/**
 * @since 0.4.0
 */
export interface ParameterDeclaration {
  readonly name: Identifier
  readonly constraint: Option<Type>
}

/**
 * @since 0.4.0
 */
export interface Data {
  readonly name: Identifier
  readonly parameterDeclarations: Array<ParameterDeclaration>
  readonly constructors: NonEmptyArray<Constructor>
}

/**
 * @since 0.4.0
 */
export function ref(name: Identifier, parameters: Array<Type> = []): Type {
  return {
    kind: 'Ref',
    name,
    parameters
  }
}

/**
 * @since 0.4.0
 */
export function tuple(types: Array<Type>): Type {
  return {
    kind: 'Tuple',
    types
  }
}

/**
 * @since 0.4.0
 */
export const unit: Type = { kind: 'Unit' }

/**
 * @since 0.4.0
 */
export function fun(domain: Type, codomain: Type): Type {
  return {
    kind: 'Fun',
    domain,
    codomain
  }
}

/**
 * @since 0.4.0
 */
export function member(type: Type, name: Option<Identifier> = none): Member {
  return {
    type,
    name
  }
}

/**
 * @since 0.4.0
 */
export function constructor(name: Identifier, members: Array<Member> = []): Constructor {
  return {
    name,
    members
  }
}

/**
 * @since 0.4.0
 */
export function parameterDeclaration(name: Identifier, constraint: Option<Type> = none): ParameterDeclaration {
  return {
    name,
    constraint
  }
}

/**
 * @since 0.4.0
 */
export function data(
  name: Identifier,
  parameterDeclarations: Array<ParameterDeclaration>,
  constructors: NonEmptyArray<Constructor>
): Data {
  return {
    name,
    parameterDeclarations,
    constructors
  }
}

/**
 * @since 0.4.0
 */
export function isNullary(c: Constructor): boolean {
  return c.members.length === 0
}

/**
 * @since 0.4.0
 */
export function isPolymorphic(d: Data): boolean {
  return d.parameterDeclarations.length > 0
}

/**
 * @since 0.4.0
 */
export function isSum(d: Data): boolean {
  return d.constructors.length > 1
}

/**
 * @since 0.4.0
 */
export function isEnum(d: Data): boolean {
  return d.constructors.every(isNullary)
}

/**
 * @since 0.4.0
 */
export function isRecursiveMember(m: Member, d: Data): boolean {
  return m.type.kind === 'Ref' && m.type.name === d.name
}

/**
 * @since 0.4.0
 */
export function isRecursive(d: Data): boolean {
  return d.constructors.some(c => c.members.some(m => isRecursiveMember(m, d)))
}
