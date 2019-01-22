POC: TypeScript code generation from a haskell-like syntax for ADT (algebraic data types)

# Usage

```ts
import { run } from 'fp-ts-codegen'

console.log(run('data Option A = None | Some A'))
```

Output

```ts
export type Option<A> =
  | {
      type: 'None'
    }
  | {
      type: 'Some'
      value0: A
    }

export const none: Option<never> = { type: 'None' }

export const some = <A>(value0: A): Option<A> => {
  return {
    type: 'Some',
    value0
  }
}

export const foldOptionL = <A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R => {
  switch (fa.type) {
    case 'None':
      return onNone()
    case 'Some':
      return onSome(fa.value0)
  }
}
```

# Modules

- `model` module: internal model
- `parser` module: haskell-like syntax -> internal model
- `printer` module: internal model -> TypeScript code
- `index` module: haskell-like syntax -> TypeScript code

# Roadmap

- add configuration options
  - lazy and eager `fold`
  - `fold` handlers as a `Record<Tag, Handler>`
  - output `fp-ts` encoding
  - ???
- derive type class instances? (`Functor`, `Foldable`, etc...)
- ???
