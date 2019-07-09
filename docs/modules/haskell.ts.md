---
title: haskell.ts
nav_order: 2
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [constructor (constant)](#constructor-constant)
- [data (constant)](#data-constant)
- [fun (constant)](#fun-constant)
- [identifier (constant)](#identifier-constant)
- [parameterDeclaration (constant)](#parameterdeclaration-constant)
- [ref (constant)](#ref-constant)
- [tuple (constant)](#tuple-constant)
- [type (constant)](#type-constant)
- [types (constant)](#types-constant)
- [parse (function)](#parse-function)

---

# constructor (constant)

**Signature**

```ts
export const constructor: P.Parser<C.Char, M.Constructor> = ...
```

Added in v0.4.0

# data (constant)

**Signature**

```ts
export const data: P.Parser<C.Char, M.Data> = ...
```

Added in v0.4.0

# fun (constant)

**Signature**

```ts
export const fun: P.Parser<C.Char, M.Type> = ...
```

Added in v0.4.0

# identifier (constant)

**Signature**

```ts
export const identifier: P.Parser<C.Char, string> = ...
```

Added in v0.4.0

# parameterDeclaration (constant)

**Signature**

```ts
export const parameterDeclaration = ...
```

# ref (constant)

**Signature**

```ts
export const ref: P.Parser<C.Char, M.Type> = ...
```

Added in v0.4.0

# tuple (constant)

**Signature**

```ts
export const tuple: P.Parser<C.Char, M.Type> = ...
```

Added in v0.4.0

# type (constant)

**Signature**

```ts
export const type: P.Parser<C.Char, M.Type> = ...
```

Added in v0.4.0

# types (constant)

**Signature**

```ts
export const types: P.Parser<C.Char, Array<M.Type>> = ...
```

Added in v0.4.0

# parse (function)

**Signature**

```ts
export function parse(s: string): Either<string, M.Data> { ... }
```

Added in v0.4.0
