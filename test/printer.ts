import * as assert from 'assert'
import * as P from '../src/printer'
import * as M from '../src/model'
import * as H from './helpers'

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
        'export type Option<A> = {\ntype: "None"\n} | {\ntype: "Some", value0: A\n}'
      )
      assert.strictEqual(
        printer(H.Either),
        'export type Either<L, A> = {\ntype: "Left", value0: L\n} | {\ntype: "Right", value0: A\n}'
      )
      assert.strictEqual(
        printer(H.Tree),
        'export type Tree<A> = {\ntype: "Leaf"\n} | {\ntype: "Node", value0: Tree<A>, value1: A, value2: Tree<A>\n}'
      )
    })

    it('nullary constructors', () => {
      const printer = P.data
      assert.strictEqual(printer(H.FooBar), 'export type FooBar = {\ntype: "Foo"\n} | {\ntype: "Bar"\n}')
    })
  })

  describe('constructors', () => {
    it('constructor', () => {
      const printer = P.constructor
      assert.strictEqual(printer(H.None), '{\ntype: "None"\n}')
      assert.strictEqual(printer(H.Some), '{\ntype: "Some", value0: A\n}')
      assert.strictEqual(printer(H.Node), '{\ntype: "Node", value0: Tree<A>, value1: A, value2: Tree<A>\n}')
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
      assert.deepStrictEqual(
        printer(H.Option),
        'export const foldOptionL = <A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R => { switch (fa.type) { case "None" : return onNone(); case "Some" : return onSome(fa.value0) } }'
      )
    })

    it('nullary constructors', () => {
      const printer = P.fold
      assert.deepStrictEqual(printer(H.FooBar), '')
    })
  })

  describe('print', () => {
    it('positional member', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.Option),
        `export type Option<A> =
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
`
      )
    })

    it('named members', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.Maybe),
        `export type Maybe<A> =
  | {
      type: 'Nothing'
    }
  | {
      type: 'Just'
      value: A
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
