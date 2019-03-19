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
export const constructor: P.Parser<M.Constructor> = ...
```

# data (constant)

**Signature**

```ts
export const data: P.Parser<M.Data> = ...
```

# fun (constant)

**Signature**

```ts
export const fun: P.Parser<M.Type> = ...
```

# identifier (constant)

**Signature**

```ts
export const identifier: P.Parser<string> = ...
```

# parameterDeclaration (constant)

**Signature**

```ts
export const parameterDeclaration = ...
```

# ref (constant)

**Signature**

```ts
export const ref: P.Parser<M.Type> = ...
```

# tuple (constant)

**Signature**

```ts
export const tuple: P.Parser<M.Type> = ...
```

# type (constant)

**Signature**

```ts
export const type: P.Parser<M.Type> = ...
```

# types (constant)

**Signature**

```ts
export const types: P.Parser<Array<M.Type>> = ...
```

# parse (function)

**Signature**

```ts
export const parse = (s: string): Either<string, M.Data> => ...
```
