TypeScript code generation from a haskell-like syntax for ADT (algebraic data types)

# Playground

[A playground with a few examples](https://gcanti.github.io/fp-ts-codegen/)

# Installation

To install the stable version:

```sh
npm install fp-ts-codegen
```

# Usage

Signature

```ts
function run(input: string, options: Options = defaultOptions): Either<string, string>
```

Example

```ts
import { run } from 'fp-ts-codegen'

console.log(run('data Option A = None | Some A'))
```

Output

```ts
/** type definition */

export type Option<A> =
  | {
      readonly type: 'None'
    }
  | {
      readonly type: 'Some'
      readonly value0: A
    }

/** constructors */

export const none: Option<never> = { type: 'None' }

export function some<A>(value0: A): Option<A> {
  return { type: 'Some', value0 }
}

/** pattern matching */

export function fold<A, R>(onNone: () => R, onSome: (value0: A) => R): (fa: Option<A>) => R {
  return fa => {
    switch (fa.type) {
      case 'None':
        return onNone()
      case 'Some':
        return onSome(fa.value0)
    }
  }
}

/** prisms */

import { Prism } from 'monocle-ts'

export function _none<A>(): Prism<Option<A>, Option<A>> {
  return Prism.fromPredicate(s => s.type === 'None')
}

export function _some<A>(): Prism<Option<A>, Option<A>> {
  return Prism.fromPredicate(s => s.type === 'Some')
}

/** Eq instance */

import { Eq } from 'fp-ts/lib/Eq'

export function getEq<A>(eqSomeValue0: Eq<A>): Eq<Option<A>> {
  return {
    equals: (x, y) => {
      if (x === y) {
        return true
      }
      if (x.type === 'None' && y.type === 'None') {
        return true
      }
      if (x.type === 'Some' && y.type === 'Some') {
        return eqSomeValue0.equals(x.value0, y.value0)
      }
      return false
    }
  }
}
```

# Records

Syntax: `{ name :: type }`

Example

Source

```haskell
--     record ---v
data User = User { name :: string, surname :: string }
```

Output

```ts
export type User = {
  readonly type: 'User'
  readonly name: string
  readonly surname: string
}

export function user(name: string, surname: string): User {
  return { type: 'User', name, surname }
}
```

# Tuples

Syntax: `(type1, type2, ...types)`

Example

Source

```haskell
--              tuple ---v
data Tuple2 A B = Tuple2 (A, B)
```

Output

```ts
export type Tuple2<A, B> = {
  readonly type: 'Tuple2'
  readonly value0: [A, B]
}

export function tuple2<A, B>(value0: [A, B]): Tuple2<A, B> {
  return { type: 'Tuple2', value0 }
}
```

# Constraints

Syntax: `(<name> :: <constraint>)`

Example

Source

```haskell
--    constraint ---v
data Constrained (A :: string) = Fetching | GotData A
```

Output

```ts
export type Constrained<A extends string> =
  | {
      readonly type: 'Fetching'
    }
  | {
      readonly type: 'GotData'
      readonly value0: A
    }
```

# Options

```ts
// fp-ts-codegen/lib/ast module

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

export const defaultOptions: Options = {
  tagName: '_tag',
  foldName: 'fold',
  handlersStyle: { type: 'positional' }
}
```

## Options management

Example

```ts
import { lenses, defaultOptions } from 'fp-ts-codegen/lib/ast'

lenses.tagName.set('tag')(defaultOptions)
/*
{
  tagName: 'tag',
  foldName: 'fold',
  ...
}
*/
```

# Modules

- `ast` module: internal model -> TypeScript AST
- `model` module: internal model
- `printer` module: internal model -> TypeScript code
- `haskell` module: haskell-like syntax -> internal model
- `index` module: haskell-like syntax -> TypeScript code

# Roadmap

- derive type class instances? (`Functor`, `Foldable`, etc...)
- ???
