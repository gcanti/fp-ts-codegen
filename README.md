POC: TypeScript code generation from a haskell-like syntax for ADT (algebraic data types)

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

```ts
//                      record ---v
console.log(run('data User = User { name :: string, surname :: string }'))
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

# Constraints

Syntax: `(<name> :: <constraint>)`

Example

```ts
//                        constraint ---v
console.log(run('data Constrained (A :: string) = Fetching | GotData A'))
```

# Options

```ts
// ast.ts

export interface Options {
  /** the name of the field used as tag */
  tagName: string
  /** the name prefix used for pattern matching functions */
  foldName: string
}

export const defaultOptions: Options = {
  tagName: 'type',
  foldName: 'fold'
}
```

# Modules

- `ast` module: internal model -> TypeScript AST
- `model` module: internal model
- `printer` module: internal model -> TypeScript code
- `parser` module: haskell-like syntax -> internal model
- `index` module: haskell-like syntax -> TypeScript code

# Roadmap

- add configuration options
  - lazy and eager `fold`
  - `fold` handlers as a `Record<Tag, Handler>`
  - output `fp-ts` encoding
  - ???
- derive type class instances? (`Functor`, `Foldable`, etc...)
- ???
