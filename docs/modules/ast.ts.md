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
- [folds (function)](#folds-function)
- [prisms (function)](#prisms-function)
- [setoid (function)](#setoid-function)

---

# AST (interface)

**Signature**

```ts
export interface AST<A> extends Reader<Options, A> {}
```

# Options (interface)

**Signature**

```ts
export interface Options {
  /** the name of the field used as tag */
  tagName: string
  /** the name prefix used for pattern matching functions */
  foldName: string
  /** the name used for the input of pattern matching functions */
  matcheeName: string
  /**
   * the pattern matching handlers can be expressed as positional arguments
   * or a single object literal `tag -> handler`
   */
  handlersStyle: { type: 'positional' } | { type: 'record'; handlersName: string }
  encoding: 'literal' | 'fp-ts'
}
```

# defaultOptions (constant)

**Signature**

```ts
export const defaultOptions: Options = ...
```

# lenses (constant)

**Signature**

```ts
export const lenses: { [K in keyof Options]: Lens<Options, Options[K]> } = ...
```

# constructors (function)

**Signature**

```ts
export const constructors = (d: M.Data): AST<Array<ts.Node>> => ...
```

# data (function)

**Signature**

```ts
export const data = (d: M.Data): AST<Array<ts.Node>> => ...
```

# folds (function)

**Signature**

```ts
export const folds = (d: M.Data): AST<Array<ts.FunctionDeclaration>> => ...
```

# prisms (function)

**Signature**

```ts
export const prisms = (d: M.Data): AST<Array<ts.Node>> => ...
```

# setoid (function)

**Signature**

```ts
export const setoid = (d: M.Data): AST<Array<ts.Node>> => ...
```
