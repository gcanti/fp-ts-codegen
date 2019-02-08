import * as assert from 'assert'
import * as M from '../../src/model'
import * as P from '../../src/printer'
import * as E from '../examples'
import { assertPrinterEqual } from '../helpers'

describe('[printer] literal encoding', () => {
  describe('data', () => {
    it('should support type literal constructors', () => {
      assertPrinterEqual(
        P.data,
        E.Option,
        `export type Option<A> = {
    readonly type: "None";
} | {
    readonly type: "Some";
    readonly value0: A;
};`
      )
      assertPrinterEqual(
        P.data,
        E.Either,
        `export type Either<L, R> = {
    readonly type: "Left";
    readonly value0: L;
} | {
    readonly type: "Right";
    readonly value0: R;
};`
      )
      assertPrinterEqual(
        P.data,
        E.Tree,
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
      assertPrinterEqual(
        P.data,
        E.User,
        `export type User = {
    readonly type: "User";
    readonly name: string;
    readonly surname: string;
};`
      )
    })

    it('should handle nullary constructors', () => {
      assertPrinterEqual(
        P.data,
        E.FooBar,
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
      assertPrinterEqual(P.constructors, E.Option, [
        'export const none: Option<never> = { type: "None" };',
        'export function some<A>(value0: A): Option<A> { return { type: "Some", value0 }; }'
      ])
      assertPrinterEqual(P.constructors, E.Either, [
        'export function left<L, R>(value0: L): Either<L, R> { return { type: "Left", value0 }; }',
        'export function right<L, R>(value0: R): Either<L, R> { return { type: "Right", value0 }; }'
      ])
      assertPrinterEqual(P.constructors, E.Tree, [
        'export const leaf: Tree<never> = { type: "Leaf" };',
        'export function node<A>(value0: Tree<A>, value1: A, value2: Tree<A>): Tree<A> { return { type: "Node", value0, value1, value2 }; }'
      ])
    })

    it('nullary constructors', () => {
      assertPrinterEqual(P.constructors, E.FooBar, [
        'export const foo: FooBar = { type: "Foo" };',
        'export const bar: FooBar = { type: "Bar" };'
      ])
    })

    it('monomorphic constructors', () => {
      assertPrinterEqual(P.constructors, E.User, [
        'export function user(name: string, surname: string): User { return { type: "User", name, surname }; }'
      ])
    })
  })

  describe('fold', () => {
    it('should not emit a fold if data is not a sum type', () => {
      assertPrinterEqual(P.fold, E.User, [])
    })

    it('should not emit a fold if all constructors are not nullary', () => {
      assertPrinterEqual(P.fold, E.Either, [
        'export function fold<L, R, R1>(fa: Either<L, R>, onLeft: (value0: L) => R1, onRight: (value0: R) => R1): R1 { switch (fa.type) {\n    case "Left": return onLeft(fa.value0);\n    case "Right": return onRight(fa.value0);\n} }'
      ])
    })

    it('should handle monomorphic data', () => {
      assertPrinterEqual(P.fold, E.FooBar, [
        'export function fold<R>(fa: FooBar, onFoo: R, onBar: R): R { switch (fa.type) {\n    case "Foo": return onFoo;\n    case "Bar": return onBar;\n} }',
        'export function foldL<R>(fa: FooBar, onFoo: () => R, onBar: () => R): R { switch (fa.type) {\n    case "Foo": return onFoo();\n    case "Bar": return onBar();\n} }'
      ])
    })
  })

  describe('prisms', () => {
    it('should handle monomorphic data', () => {
      assertPrinterEqual(P.prisms, E.FooBar, [
        'import { Prism } from "monocle-ts";',
        'export const _Foo: Prism<FooBar, FooBar> = Prism.fromPredicate(s => s.type === "Foo");',
        'export const _Bar: Prism<FooBar, FooBar> = Prism.fromPredicate(s => s.type === "Bar");'
      ])
    })
  })

  describe('print', () => {
    it('positional members', () => {
      assert.strictEqual(
        P.print(E.Option),
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
} }

import { Prism } from "monocle-ts";

export function _none<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.type === "None"); }

export function _some<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.type === "Some"); }`
      )
    })

    it('named members', () => {
      assert.strictEqual(
        P.print(E.Maybe),
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
} }

import { Prism } from "monocle-ts";

export function _nothing<A>(): Prism<Maybe<A>, Maybe<A>> { return Prism.fromPredicate(s => s.type === "Nothing"); }

export function _just<A>(): Prism<Maybe<A>, Maybe<A>> { return Prism.fromPredicate(s => s.type === "Just"); }`
      )
    })

    it('constrained parameter', () => {
      assert.strictEqual(
        P.print(E.Constrained),
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
} }

import { Prism } from "monocle-ts";

export function _fetching<A extends string>(): Prism<Constrained<A>, Constrained<A>> { return Prism.fromPredicate(s => s.type === "Fetching"); }

export function _gotData<A extends string>(): Prism<Constrained<A>, Constrained<A>> { return Prism.fromPredicate(s => s.type === "GotData"); }`
      )
    })

    it('tuples', () => {
      assert.strictEqual(
        P.print(E.Tuple2),
        `export type Tuple2<A, B> = {
    readonly type: "Tuple2";
    readonly value0: [A, B];
};

export function tuple2<A, B>(value0: [A, B]): Tuple2<A, B> { return { type: "Tuple2", value0 }; }`
      )
    })

    describe('functions', () => {
      it('type reference domain', () => {
        assert.strictEqual(
          P.print(E.State),
          `export type State<S, A> = {
    readonly type: "State";
    readonly value0: (s: S) => [A, S];
};

export function state<S, A>(value0: (s: S) => [A, S]): State<S, A> { return { type: "State", value0 }; }`
        )
      })

      it('tuple domain', () => {
        assert.strictEqual(
          P.print(
            M.data(
              'Tuple',
              [],
              M.constructor('Tuple', [M.member(M.fun(M.tuple([M.ref('A'), M.ref('B')]), M.ref('C')))])
            )
          ),
          `export type Tuple = {
    readonly type: "Tuple";
    readonly value0: (tuple: [A, B]) => C;
};

export function tuple(value0: (tuple: [A, B]) => C): Tuple { return { type: "Tuple", value0 }; }`
        )
      })

      it('function domain', () => {
        assert.strictEqual(
          P.print(
            M.data(
              'Function',
              [],
              M.constructor('Function', [M.member(M.fun(M.fun(M.ref('A'), M.ref('B')), M.ref('C')))])
            )
          ),
          `export type Function = {
    readonly type: "Function";
    readonly value0: (f: (a: A) => B) => C;
};

export function function(value0: (f: (a: A) => B) => C): Function { return { type: "Function", value0 }; }`
        )
      })
    })

    it('records', () => {
      assert.strictEqual(
        P.print(E.User),
        `export type User = {
    readonly type: "User";
    readonly name: string;
    readonly surname: string;
};

export function user(name: string, surname: string): User { return { type: "User", name, surname }; }`
      )
    })

    it('unit', () => {
      assert.strictEqual(
        P.print(E.Writer),
        `export type Writer<W, A> = {
    readonly type: "Writer";
    readonly value0: () => [A, W];
};

export function writer<W, A>(value0: () => [A, W]): Writer<W, A> { return { type: "Writer", value0 }; }`
      )

      assert.strictEqual(
        P.print(M.data('Unit', [], M.constructor('Unit', [M.member(M.unit)]))),
        `export type Unit = {
    readonly type: "Unit";
    readonly value0: undefined;
};

export function unit(value0: undefined): Unit { return { type: "Unit", value0 }; }`
      )
    })
  })
})
