---
title: printer.ts
nav_order: 5
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Printer (interface)](#printer-interface)
- [all (function)](#all-function)
- [ast (function)](#ast-function)
- [constructors (function)](#constructors-function)
- [data (function)](#data-function)
- [folds (function)](#folds-function)
- [getMonoid (function)](#getmonoid-function)
- [print (function)](#print-function)
- [prisms (function)](#prisms-function)
- [setoid (function)](#setoid-function)

---

# Printer (interface)

**Signature**

```ts
export interface Printer<A> extends Reader<Ast.Options, A> {}
```

# all (function)

**Signature**

```ts
export const all = (d: M.Data): Printer<Array<string>> => ...
```

# ast (function)

**Signature**

```ts
export const ast = (ast: ts.Node): string => ...
```

# constructors (function)

**Signature**

```ts
export const constructors = (d: M.Data): Printer<Array<string>> => ...
```

# data (function)

**Signature**

```ts
export const data = (d: M.Data): Printer<string> => ...
```

# folds (function)

**Signature**

```ts
export const folds = (d: M.Data): Printer<Array<string>> => ...
```

# getMonoid (function)

**Signature**

```ts
export const getMonoid = <A>(M: Mon.Monoid<A>): Mon.Monoid<Printer<A>> => ...
```

# print (function)

**Signature**

```ts
export const print = (d: M.Data, options: Ast.Options): string => ...
```

# prisms (function)

**Signature**

```ts
export const prisms = (d: M.Data): Printer<Array<string>> => ...
```

# setoid (function)

**Signature**

```ts
export const setoid = (d: M.Data): Printer<Array<string>> => ...
```
