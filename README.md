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
      readonly type: 'None'
    }
  | {
      readonly type: 'Some'
      readonly value0: A
    }

export const none: Option<never> = { type: 'None' }

export const some = <A>(value0: A): Option<A> => {
  return {
    type: 'Some',
    value0
  }
}

export const foldL = <A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R => {
  switch (fa.type) {
    case 'None':
      return onNone()
    case 'Some':
      return onSome(fa.value0)
  }
}
```

# Named members

Syntax: `<name>:<type>`

Example

```ts
//                             named member ---v
console.log(run('data Maybe A = Nothing | Just value:A'))
```

Output

```ts
export type Maybe<A> =
  | {
      readonly type: 'Nothing'
    }
  | {
      readonly type: 'Just'
      readonly value: A
    }

export const nothing: Maybe<never> = { type: 'Nothing' }

export const just = <A>(value: A): Maybe<A> => {
  return {
    type: 'Just',
    value
  }
}

export const foldL = <A, R>(fa: Maybe<A>, onNothing: () => R, onJust: (value: A) => R): R => {
  switch (fa.type) {
    case 'Nothing':
      return onNothing()
    case 'Just':
      return onJust(fa.value)
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
