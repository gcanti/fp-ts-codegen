---
title: model.ts
nav_order: 4
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor (interface)](#constructor-interface)
- [Data (interface)](#data-interface)
- [Member (interface)](#member-interface)
- [ParameterDeclaration (interface)](#parameterdeclaration-interface)
- [Identifier (type alias)](#identifier-type-alias)
- [Type (type alias)](#type-type-alias)
- [unit (constant)](#unit-constant)
- [constructor (function)](#constructor-function)
- [data (function)](#data-function)
- [fun (function)](#fun-function)
- [isEnum (function)](#isenum-function)
- [isNullary (function)](#isnullary-function)
- [isPolymorphic (function)](#ispolymorphic-function)
- [isRecursive (function)](#isrecursive-function)
- [isRecursiveMember (function)](#isrecursivemember-function)
- [isSum (function)](#issum-function)
- [member (function)](#member-function)
- [parameterDeclaration (function)](#parameterdeclaration-function)
- [ref (function)](#ref-function)
- [tuple (function)](#tuple-function)

---

# Constructor (interface)

**Signature**

```ts
export interface Constructor {
  readonly name: Identifier
  readonly members: Array<Member>
}
```

# Data (interface)

**Signature**

```ts
export interface Data {
  readonly name: Identifier
  readonly parameterDeclarations: Array<ParameterDeclaration>
  readonly constructors: NonEmptyArray<Constructor>
}
```

# Member (interface)

**Signature**

```ts
export interface Member {
  readonly type: Type
  readonly name: Option<Identifier>
}
```

# ParameterDeclaration (interface)

**Signature**

```ts
export interface ParameterDeclaration {
  readonly name: Identifier
  readonly constraint: Option<Type>
}
```

# Identifier (type alias)

**Signature**

```ts
export type Identifier = string
```

# Type (type alias)

**Signature**

```ts
export type Type = Ref | Tuple | Fun | Unit
```

# unit (constant)

**Signature**

```ts
export const unit: Type = ...
```

# constructor (function)

**Signature**

```ts
export const constructor = (name: Identifier, members: Array<Member> = []): Constructor => ...
```

# data (function)

**Signature**

```ts
export const data = (
  name: Identifier,
  parameterDeclarations: Array<ParameterDeclaration>,
  head: Constructor,
  tail: Array<Constructor> = []
): Data => ...
```

# fun (function)

**Signature**

```ts
export const fun = (domain: Type, codomain: Type): Type => ...
```

# isEnum (function)

**Signature**

```ts
export const isEnum = (d: Data): boolean => ...
```

# isNullary (function)

**Signature**

```ts
export const isNullary = (c: Constructor): boolean => ...
```

# isPolymorphic (function)

**Signature**

```ts
export const isPolymorphic = (d: Data): boolean => ...
```

# isRecursive (function)

**Signature**

```ts
export const isRecursive = (d: Data): boolean => ...
```

# isRecursiveMember (function)

**Signature**

```ts
export const isRecursiveMember = (m: Member, d: Data): boolean => ...
```

# isSum (function)

**Signature**

```ts
export const isSum = (d: Data): boolean => ...
```

# member (function)

**Signature**

```ts
export const member = (type: Type, name: Option<Identifier> = none): Member => ...
```

# parameterDeclaration (function)

**Signature**

```ts
export const parameterDeclaration = (name: Identifier, constraint: Option<Type> = none): ParameterDeclaration => ...
```

# ref (function)

**Signature**

```ts
export const ref = (name: Identifier, parameters: Array<Type> = []): Type => ...
```

# tuple (function)

**Signature**

```ts
export const tuple = (types: Array<Type>): Type => ...
```
