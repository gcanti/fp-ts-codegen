import * as assert from 'assert'
import * as P from '../src/printer'
import * as M from '../src/model'
import * as H from './helpers'
import { NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'

describe('printer', () => {
  describe('data', () => {
    it('type', () => {
      const printer = P.type
      assert.strictEqual(printer(M.type('A', [])), 'A')
      assert.strictEqual(printer(M.type('Option', [M.type('A')])), 'Option<A>')
      assert.strictEqual(printer(M.type('Either', [M.type('L'), M.type('A')])), 'Either<L, A>')
    })

    it('data', () => {
      const printer = P.data
      assert.strictEqual(
        printer(H.Option),
        'export type Option<A> = {\nreadonly type: "None"\n} | {\nreadonly type: "Some", readonly value0: A\n}'
      )
      assert.strictEqual(
        printer(H.Either),
        'export type Either<L, A> = {\nreadonly type: "Left", readonly value0: L\n} | {\nreadonly type: "Right", readonly value0: A\n}'
      )
      assert.strictEqual(
        printer(H.Tree),
        'export type Tree<A> = {\nreadonly type: "Leaf"\n} | {\nreadonly type: "Node", readonly value0: Tree<A>, readonly value1: A, readonly value2: Tree<A>\n}'
      )
    })

    it('nullary constructors', () => {
      const printer = P.data
      assert.strictEqual(
        printer(H.FooBar),
        'export type FooBar = {\nreadonly type: "Foo"\n} | {\nreadonly type: "Bar"\n}'
      )
    })
  })

  describe('constructors', () => {
    it('constructor', () => {
      const printer = P.constructor
      assert.strictEqual(printer(H.None), '{\nreadonly type: "None"\n}')
      assert.strictEqual(printer(H.Some), '{\nreadonly type: "Some", readonly value0: A\n}')
      assert.strictEqual(
        printer(H.Node),
        '{\nreadonly type: "Node", readonly value0: Tree<A>, readonly value1: A, readonly value2: Tree<A>\n}'
      )
    })

    it('constructors', () => {
      const printer = P.constructors
      assert.deepStrictEqual(printer(H.Option), [
        'export const none: Option<never> = { type: "None" }',
        'export const some = <A>(value0: A): Option<A> => { return {\ntype: "Some", value0\n} }'
      ])
      assert.deepStrictEqual(printer(H.Either), [
        'export const left = <L, A>(value0: L): Either<L, A> => { return {\ntype: "Left", value0\n} }',
        'export const right = <L, A>(value0: A): Either<L, A> => { return {\ntype: "Right", value0\n} }'
      ])
      assert.deepStrictEqual(printer(H.Tree), [
        'export const leaf: Tree<never> = { type: "Leaf" }',
        'export const node = <A>(value0: Tree<A>, value1: A, value2: Tree<A>): Tree<A> => { return {\ntype: "Node", value0, value1, value2\n} }'
      ])
    })

    it('nullary constructors', () => {
      const printer = P.constructors
      assert.deepStrictEqual(printer(H.FooBar), [
        'export const foo: FooBar = { type: "Foo" }',
        'export const bar: FooBar = { type: "Bar" }'
      ])
    })

    it('monomorphic constructors', () => {
      const printer = P.constructors
      assert.deepStrictEqual(printer(H.User), [
        'export const user = (name: string, surname: string): User => { return {\ntype: "User", name, surname\n} }'
      ])
    })
  })

  describe('fold', () => {
    it('lazy positional fold', () => {
      const printer = P.fold
      assert.strictEqual(
        printer(H.Option),
        'export const foldOptionL = <A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R => { switch (fa.type) { case "None" : return onNone(); case "Some" : return onSome(fa.value0) } }'
      )
    })

    it('should not emit a fold if data is not a sum type', () => {
      const printer = P.fold
      assert.strictEqual(printer(H.User), '')
    })

    it('should choose a unused return type', () => {
      const printer = P.fold
      assert.strictEqual(
        printer(
          M.data(M.introduction('T', ['R']), new NonEmptyArray(M.constructor('C1', []), [M.constructor('C2', [])]))
        ),
        'export const foldTL = <R, R1>(fa: T<R>, onC1: () => R1, onC2: () => R1): R1 => { switch (fa.type) { case "C1" : return onC1(); case "C2" : return onC2() } }'
      )
    })

    it('should handle monomorphic data', () => {
      const printer = P.fold
      assert.strictEqual(
        printer(H.FooBar),
        'export const foldFooBarL = <R>(fa: FooBar, onFoo: () => R, onBar: () => R): R => { switch (fa.type) { case "Foo" : return onFoo(); case "Bar" : return onBar() } }'
      )
    })
  })

  describe('print', () => {
    it('positional member', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.Option),
        `export type Option<A> =
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

export const foldOptionL = <A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R => {
  switch (fa.type) {
    case 'None':
      return onNone()
    case 'Some':
      return onSome(fa.value0)
  }
}
`
      )
    })

    it('named members', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.Maybe),
        `export type Maybe<A> =
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

export const foldMaybeL = <A, R>(fa: Maybe<A>, onNothing: () => R, onJust: (value: A) => R): R => {
  switch (fa.type) {
    case 'Nothing':
      return onNothing()
    case 'Just':
      return onJust(fa.value)
  }
}
`
      )
    })
  })
})
