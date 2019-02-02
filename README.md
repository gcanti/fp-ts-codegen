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

//                                       eager ---v
export function fold<A, R>(fa: Option<A>, onNone: R, onSome: (value0: A) => R): R {
  switch (fa.type) {
    case 'None':
      return onNone
    case 'Some':
      return onSome(fa.value0)
  }
}

//                                         lazy ---v
export function foldL<A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R {
  switch (fa.type) {
    case 'None':
      return onNone()
    case 'Some':
      return onSome(fa.value0)
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

# `fp-ts` encoding

Example

Source

```haskell
data Option A = None | Some A
```

Output

```ts
declare module 'fp-ts/lib/HKT' {
  interface URI2HKT<A> {
    Option: Option<A>
  }
}

export const URI = 'Option'

export type URI = typeof URI

export type Option<A> = None<A> | Some<A>

export class None<A> {
  static value: Option<never> = new None()
  readonly _tag: 'None' = 'None'
  readonly _A!: A
  readonly _URI!: URI
  private constructor() {}
  fold<R>(onNone: R, _onSome: (value0: A) => R): R {
    return onNone
  }
  foldL<R>(onNone: () => R, _onSome: (value0: A) => R): R {
    return onNone()
  }
}

export class Some<A> {
  readonly _tag: 'Some' = 'Some'
  readonly _A!: A
  readonly _URI!: URI
  constructor(readonly value0: A) {}
  fold<R>(_onNone: R, onSome: (value0: A) => R): R {
    return onSome(this.value0)
  }
  foldL<R>(_onNone: () => R, onSome: (value0: A) => R): R {
    return onSome(this.value0)
  }
}

export const none: Option<never> = None.value

export function some<A>(value0: A): Option<A> {
  return new Some(value0)
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
  /** the name used for the input of pattern matching functions */
  matcheeName: string
  /**
   * the pattern matching handlers can be expressed as positional arguments
   * or a single object literal `tag -> handler`
   */
  handlersStyle: { type: 'positional' } | { type: 'record'; handlersName: string }
  encoding: 'literal' | 'fp-ts'
}

export const defaultOptions: Options = {
  tagName: 'type',
  foldName: 'fold',
  matcheeName: 'fa',
  handlersStyle: { type: 'positional' },
  encoding: 'literal'
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
  matcheeName: 'fa',
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
