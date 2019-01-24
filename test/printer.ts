import * as assert from 'assert'
import * as P from '../src/printer'
import * as H from './helpers'
import { Options, defaultOptions, lenses } from '../src/ast'

const assertEqual = <A, B>(f: (a: A) => P.Printer<B>, a: A, expected: B, options: Options = defaultOptions) => {
  const actual = f(a).run(options)
  assert.deepStrictEqual(actual, expected)
}

describe('printer', () => {
  describe('data', () => {
    it('data', () => {
      assertEqual(
        P.data,
        H.Option,
        `export type Option<A> = {
    readonly type: "None";
} | {
    readonly type: "Some";
    readonly value0: A;
};`
      )
      assertEqual(
        P.data,
        H.Either,
        `export type Either<L, R> = {
    readonly type: "Left";
    readonly value0: L;
} | {
    readonly type: "Right";
    readonly value0: R;
};`
      )
      assertEqual(
        P.data,
        H.Tree,
        `export type Tree<A> = {
    readonly type: "Leaf";
} | {
    readonly type: "Node";
    readonly value0: Tree<A>;
    readonly value1: A;
    readonly value2: Tree<A>;
};`
      )
    })

    it('should handle only one constructor', () => {
      assertEqual(
        P.data,
        H.User,
        `export type User = {
    readonly type: "User";
    readonly name: string;
    readonly surname: string;
};`
      )
    })

    it('should handle nullary constructors', () => {
      assertEqual(
        P.data,
        H.FooBar,
        `export type FooBar = {
    readonly type: "Foo";
} | {
    readonly type: "Bar";
};`
      )
    })
  })

  describe('constructors', () => {
    it('constructors', () => {
      assertEqual(P.constructors, H.Option, [
        'export const none: Option<never> = { type: "None" };',
        'export function some<A>(value0: A): Option<A> { return { type: "Some", value0 }; }'
      ])
      assertEqual(P.constructors, H.Either, [
        'export function left<L, R>(value0: L): Either<L, R> { return { type: "Left", value0 }; }',
        'export function right<L, R>(value0: R): Either<L, R> { return { type: "Right", value0 }; }'
      ])
      assertEqual(P.constructors, H.Tree, [
        'export const leaf: Tree<never> = { type: "Leaf" };',
        'export function node<A>(value0: Tree<A>, value1: A, value2: Tree<A>): Tree<A> { return { type: "Node", value0, value1, value2 }; }'
      ])
    })

    it('nullary constructors', () => {
      assertEqual(P.constructors, H.FooBar, [
        'export const foo: FooBar = { type: "Foo" };',
        'export const bar: FooBar = { type: "Bar" };'
      ])
    })

    it('monomorphic constructors', () => {
      assertEqual(P.constructors, H.User, [
        'export function user(name: string, surname: string): User { return { type: "User", name, surname }; }'
      ])
    })
  })

  describe('fold', () => {
    it('should not emit a fold if data is not a sum type', () => {
      assertEqual(P.fold, H.User, [])
    })

    it('should not emit a fold if all constructors are not nullary', () => {
      assertEqual(P.fold, H.Either, [
        'export function fold<L, R, R1>(fa: Either<L, R>, onLeft: (value0: L) => R1, onRight: (value0: R) => R1): R1 { switch (fa.type) {\n    case "Left": return onLeft(fa.value0);\n    case "Right": return onRight(fa.value0);\n} }'
      ])
    })

    it('should handle monomorphic data', () => {
      assertEqual(P.fold, H.FooBar, [
        'export function fold<R>(fa: FooBar, onFoo: R, onBar: R): R { switch (fa.type) {\n    case "Foo": return onFoo;\n    case "Bar": return onBar;\n} }',
        'export function foldL<R>(fa: FooBar, onFoo: () => R, onBar: () => R): R { switch (fa.type) {\n    case "Foo": return onFoo();\n    case "Bar": return onBar();\n} }'
      ])
    })
  })

  describe('print', () => {
    it('positional members', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.Option),
        `export type Option<A> = {
    readonly type: "None";
} | {
    readonly type: "Some";
    readonly value0: A;
};

export const none: Option<never> = { type: "None" };

export function some<A>(value0: A): Option<A> { return { type: "Some", value0 }; }

export function fold<A, R>(fa: Option<A>, onNone: R, onSome: (value0: A) => R): R { switch (fa.type) {
    case "None": return onNone;
    case "Some": return onSome(fa.value0);
} }

export function foldL<A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R { switch (fa.type) {
    case "None": return onNone();
    case "Some": return onSome(fa.value0);
} }`
      )
    })

    it('named members', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.Maybe),
        `export type Maybe<A> = {
    readonly type: "Nothing";
} | {
    readonly type: "Just";
    readonly value: A;
};

export const nothing: Maybe<never> = { type: "Nothing" };

export function just<A>(value: A): Maybe<A> { return { type: "Just", value }; }

export function fold<A, R>(fa: Maybe<A>, onNothing: R, onJust: (value: A) => R): R { switch (fa.type) {
    case "Nothing": return onNothing;
    case "Just": return onJust(fa.value);
} }

export function foldL<A, R>(fa: Maybe<A>, onNothing: () => R, onJust: (value: A) => R): R { switch (fa.type) {
    case "Nothing": return onNothing();
    case "Just": return onJust(fa.value);
} }`
      )
    })

    it('constrained parameter', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.Constrained),
        `export type Constrained<A extends string> = {
    readonly type: "Fetching";
} | {
    readonly type: "GotData";
    readonly value0: A;
};

export const fetching: Constrained<string> = { type: "Fetching" };

export function gotData<A extends string>(value0: A): Constrained<A> { return { type: "GotData", value0 }; }

export function fold<A extends string, R>(fa: Constrained<A>, onFetching: R, onGotData: (value0: A) => R): R { switch (fa.type) {
    case "Fetching": return onFetching;
    case "GotData": return onGotData(fa.value0);
} }

export function foldL<A extends string, R>(fa: Constrained<A>, onFetching: () => R, onGotData: (value0: A) => R): R { switch (fa.type) {
    case "Fetching": return onFetching();
    case "GotData": return onGotData(fa.value0);
} }`
      )
    })

    it('records', () => {
      const printer = P.print
      assert.strictEqual(
        printer(H.User),
        `export type User = {
    readonly type: "User";
    readonly name: string;
    readonly surname: string;
};

export function user(name: string, surname: string): User { return { type: "User", name, surname }; }`
      )
    })

    describe('options', () => {
      it('should handle custom tag names', () => {
        const printer = P.print
        assert.strictEqual(
          printer(H.Option, lenses.tagName.set('tag')(defaultOptions)),
          `export type Option<A> = {
    readonly tag: "None";
} | {
    readonly tag: "Some";
    readonly value0: A;
};

export const none: Option<never> = { tag: "None" };

export function some<A>(value0: A): Option<A> { return { tag: "Some", value0 }; }

export function fold<A, R>(fa: Option<A>, onNone: R, onSome: (value0: A) => R): R { switch (fa.tag) {
    case "None": return onNone;
    case "Some": return onSome(fa.value0);
} }

export function foldL<A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R { switch (fa.tag) {
    case "None": return onNone();
    case "Some": return onSome(fa.value0);
} }`
        )
      })

      it('should handle custom fold names', () => {
        assertEqual(
          P.fold,
          H.Option,
          [
            `export function match<A, R>(fa: Option<A>, onNone: R, onSome: (value0: A) => R): R { switch (fa.type) {
    case "None": return onNone;
    case "Some": return onSome(fa.value0);
} }`,
            `export function matchL<A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R { switch (fa.type) {
    case "None": return onNone();
    case "Some": return onSome(fa.value0);
} }`
          ],
          lenses.foldName.set('match')(defaultOptions)
        )
      })

      it('should handle custom matchee name', () => {
        assertEqual(
          P.fold,
          H.Option,
          [
            `export function fold<A, R>(input: Option<A>, onNone: R, onSome: (value0: A) => R): R { switch (input.type) {
    case "None": return onNone;
    case "Some": return onSome(input.value0);
} }`,
            `export function foldL<A, R>(input: Option<A>, onNone: () => R, onSome: (value0: A) => R): R { switch (input.type) {
    case "None": return onNone();
    case "Some": return onSome(input.value0);
} }`
          ],
          lenses.matcheeName.set('input')(defaultOptions)
        )
      })
    })
  })
})
