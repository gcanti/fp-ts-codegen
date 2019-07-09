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
- [eq (function)](#eq-function)
- [fold (function)](#fold-function)
- [getMonoid (function)](#getmonoid-function)
- [print (function)](#print-function)
- [prisms (function)](#prisms-function)

---

# Printer (interface)

**Signature**

```ts
export interface Printer<A> extends R.Reader<Ast.Options, A> {}
```

Added in v0.4.0

# all (function)

**Signature**

```ts
export function all(d: M.Data): Printer<Array<string>> { ... }
```

Added in v0.4.0

# ast (function)

**Signature**

```ts
export function ast(ast: ts.Node): string { ... }
```

Added in v0.4.0

# constructors (function)

**Signature**

```ts
export function constructors(d: M.Data): Printer<Array<string>> { ... }
```

Added in v0.4.0

# data (function)

**Signature**

```ts
export function data(d: M.Data): Printer<string> { ... }
```

Added in v0.4.0

# eq (function)

**Signature**

```ts
export function eq(d: M.Data): Printer<Array<string>> { ... }
```

Added in v0.4.0

# fold (function)

**Signature**

```ts
export function fold(d: M.Data): Printer<string> { ... }
```

Added in v0.4.0

# getMonoid (function)

**Signature**

```ts
export function getMonoid<A>(M: Mon.Monoid<A>): Mon.Monoid<Printer<A>> { ... }
```

Added in v0.4.0

# print (function)

**Signature**

```ts
export function print(options: Ast.Options): (d: M.Data) => string { ... }
```

Added in v0.4.0

# prisms (function)

**Signature**

```ts
export function prisms(d: M.Data): Printer<Array<string>> { ... }
```

Added in v0.4.0
