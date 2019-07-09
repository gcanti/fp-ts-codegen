---
title: ast.ts
nav_order: 1
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [AST (interface)](#ast-interface)
- [Options (interface)](#options-interface)
- [defaultOptions (constant)](#defaultoptions-constant)
- [lenses (constant)](#lenses-constant)
- [constructors (function)](#constructors-function)
- [data (function)](#data-function)
- [eq (function)](#eq-function)
- [fold (function)](#fold-function)
- [prisms (function)](#prisms-function)

---

# AST (interface)

**Signature**

```ts
export interface AST<A> extends R.Reader<Options, A> {}
```

Added in v0.4.0

# Options (interface)

**Signature**

```ts
export interface Options {
  /** the name of the field used as tag */
  tagName: string
  /** the name prefix used for pattern matching functions */
  foldName: string
  /**
   * the pattern matching handlers can be expressed as positional arguments
   * or a single object literal `tag -> handler`
   */
  handlersStyle: { type: 'positional' } | { type: 'record'; handlersName: string }
}
```

Added in v0.4.0

# defaultOptions (constant)

**Signature**

```ts
export const defaultOptions: Options = ...
```

Added in v0.4.0

# lenses (constant)

**Signature**

```ts
export const lenses: { [K in keyof Options]: Lens<Options, Options[K]> } = ...
```

Added in v0.4.0

# constructors (function)

**Signature**

```ts
export function constructors(d: M.Data): AST<Array<ts.Node>> { ... }
```

Added in v0.4.0

# data (function)

**Signature**

```ts
export function data(d: M.Data): AST<Array<ts.Node>> { ... }
```

Added in v0.4.0

# eq (function)

**Signature**

```ts
export function eq(d: M.Data): AST<Array<ts.Node>> { ... }
```

Added in v0.4.0

# fold (function)

**Signature**

```ts
export function fold(d: M.Data): AST<O.Option<ts.FunctionDeclaration>> { ... }
```

Added in v0.4.0

# prisms (function)

**Signature**

```ts
export function prisms(d: M.Data): AST<Array<ts.Node>> { ... }
```

Added in v0.4.0
