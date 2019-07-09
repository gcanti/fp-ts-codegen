---
title: model.ts
nav_order: 4
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Constructor (interface)](#constructor-interface)
- [Data (interface)](#data-interface)
- [Fun (interface)](#fun-interface)
- [Member (interface)](#member-interface)
- [ParameterDeclaration (interface)](#parameterdeclaration-interface)
- [Ref (interface)](#ref-interface)
- [Tuple (interface)](#tuple-interface)
- [Unit (interface)](#unit-interface)
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

Added in v0.4.0

# Data (interface)

**Signature**

```ts
export interface Data {
  readonly name: Identifier
  readonly parameterDeclarations: Array<ParameterDeclaration>
  readonly constructors: NonEmptyArray<Constructor>
}
```

Added in v0.4.0

# Fun (interface)

**Signature**

```ts
export interface Fun {
  readonly kind: 'Fun'
  readonly domain: Type
  readonly codomain: Type
}
```

Added in v0.4.0

# Member (interface)

**Signature**

```ts
export interface Member {
  readonly type: Type
  readonly name: Option<Identifier>
}
```

Added in v0.4.0

# ParameterDeclaration (interface)

**Signature**

```ts
export interface ParameterDeclaration {
  readonly name: Identifier
  readonly constraint: Option<Type>
}
```

Added in v0.4.0

# Ref (interface)

**Signature**

```ts
export interface Ref {
  readonly kind: 'Ref'
  readonly name: Identifier
  readonly parameters: Array<Type>
}
```

Added in v0.4.0

# Tuple (interface)

**Signature**

```ts
export interface Tuple {
  readonly kind: 'Tuple'
  readonly types: Array<Type>
}
```

Added in v0.4.0

# Unit (interface)

**Signature**

```ts
export interface Unit {
  readonly kind: 'Unit'
}
```

Added in v0.4.0

# Identifier (type alias)

**Signature**

```ts
export type Identifier = string
```

Added in v0.4.0

# Type (type alias)

**Signature**

```ts
export type Type = Ref | Tuple | Fun | Unit
```

Added in v0.4.0

# unit (constant)

**Signature**

```ts
export const unit: Type = ...
```

Added in v0.4.0

# constructor (function)

**Signature**

```ts
export function constructor(name: Identifier, members: Array<Member> = []): Constructor { ... }
```

Added in v0.4.0

# data (function)

**Signature**

```ts
export function data(
  name: Identifier,
  parameterDeclarations: Array<ParameterDeclaration>,
  constructors: NonEmptyArray<Constructor>
): Data { ... }
```

Added in v0.4.0

# fun (function)

**Signature**

```ts
export function fun(domain: Type, codomain: Type): Type { ... }
```

Added in v0.4.0

# isEnum (function)

**Signature**

```ts
export function isEnum(d: Data): boolean { ... }
```

Added in v0.4.0

# isNullary (function)

**Signature**

```ts
export function isNullary(c: Constructor): boolean { ... }
```

Added in v0.4.0

# isPolymorphic (function)

**Signature**

```ts
export function isPolymorphic(d: Data): boolean { ... }
```

Added in v0.4.0

# isRecursive (function)

**Signature**

```ts
export function isRecursive(d: Data): boolean { ... }
```

Added in v0.4.0

# isRecursiveMember (function)

**Signature**

```ts
export function isRecursiveMember(m: Member, d: Data): boolean { ... }
```

Added in v0.4.0

# isSum (function)

**Signature**

```ts
export function isSum(d: Data): boolean { ... }
```

Added in v0.4.0

# member (function)

**Signature**

```ts
export function member(type: Type, name: Option<Identifier> = none): Member { ... }
```

Added in v0.4.0

# parameterDeclaration (function)

**Signature**

```ts
export function parameterDeclaration(name: Identifier, constraint: Option<Type> = none): ParameterDeclaration { ... }
```

Added in v0.4.0

# ref (function)

**Signature**

```ts
export function ref(name: Identifier, parameters: Array<Type> = []): Type { ... }
```

Added in v0.4.0

# tuple (function)

**Signature**

```ts
export function tuple(types: Array<Type>): Type { ... }
```

Added in v0.4.0
