import * as assert from 'assert'
import * as M from '../src/model'
import * as P from '../src/printer'
import * as E from './examples'
import { assertPrinterEqual } from './helpers'
import { defaultOptions, lenses } from '../src/ast'

describe('printer', () => {
  describe('literal encoding', () => {
    describe('data', () => {
      it('positional fields', () => {
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
          `export type Either<E, R> = {
    readonly type: "Left";
    readonly value0: E;
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

      it('record fields', () => {
        assertPrinterEqual(
          P.data,
          E.Maybe,
          `export type Maybe<A> = {
    readonly type: "Nothing";
} | {
    readonly type: "Just";
    readonly value: A;
};`
        )
      })

      it('constrained data', () => {
        assertPrinterEqual(
          P.data,
          E.Constrained,
          `export type Constrained<A extends string> = {
    readonly type: "Fetching";
} | {
    readonly type: "GotData";
    readonly value0: A;
};`
        )
      })

      it('tuple domain', () => {
        const data = M.data(
          'Tuple',
          [],
          [M.constructor('Tuple', [M.member(M.fun(M.tuple([M.ref('A'), M.ref('B')]), M.ref('C')))])]
        )
        assertPrinterEqual(
          P.data,
          data,
          `export type Tuple = {
    readonly value0: (tuple: [A, B]) => C;
};`
        )
      })

      it('function domain', () => {
        const data = M.data(
          'Function',
          [],
          [M.constructor('Function', [M.member(M.fun(M.fun(M.ref('A'), M.ref('B')), M.ref('C')))])]
        )
        assertPrinterEqual(
          P.data,
          data,
          `export type Function = {
    readonly value0: (f: (a: A) => B) => C;
};`
        )
      })

      it('tuple field', () => {
        assertPrinterEqual(
          P.data,
          E.Tuple2,
          `export type Tuple2<A, B> = {
    readonly value0: [A, B];
};`
        )
      })

      it('unit field', () => {
        const data = M.data('Unit', [], [M.constructor('Unit', [M.member(M.unit)])])
        assertPrinterEqual(
          P.data,
          data,
          `export type Unit = {
    readonly value0: undefined;
};`
        )
      })

      it('function fields', () => {
        assertPrinterEqual(
          P.data,
          E.Writer,
          `export type Writer<W, A> = {
    readonly value0: () => [A, W];
};`
        )
        assertPrinterEqual(
          P.data,
          E.State,
          `export type State<S, A> = {
    readonly value0: (s: S) => [A, S];
};`
        )
      })

      it('should handle only one constructor', () => {
        assertPrinterEqual(
          P.data,
          E.User,
          `export type User = {
    readonly name: string;
    readonly surname: string;
    readonly age: number;
};`
        )
      })

      it('should handle nullary constructors', () => {
        assertPrinterEqual(
          P.data,
          E.FooBarBaz,
          `export type FooBarBaz = {
    readonly type: "Foo";
} | {
    readonly type: "Bar";
} | {
    readonly type: "Baz";
};`
        )
      })
    })

    describe('constructors', () => {
      it('positional fields', () => {
        assertPrinterEqual(P.constructors, E.Option, [
          'export const none: Option<never> = { type: "None" };',
          'export function some<A>(value0: A): Option<A> { return { type: "Some", value0 }; }'
        ])
        assertPrinterEqual(P.constructors, E.Either, [
          'export function left<E, R>(value0: E): Either<E, R> { return { type: "Left", value0 }; }',
          'export function right<E, R>(value0: R): Either<E, R> { return { type: "Right", value0 }; }'
        ])
        assertPrinterEqual(P.constructors, E.Tree, [
          'export const leaf: Tree<never> = { type: "Leaf" };',
          'export function node<A>(value0: Tree<A>, value1: A, value2: Tree<A>): Tree<A> { return { type: "Node", value0, value1, value2 }; }'
        ])
      })

      it('record fields', () => {
        assertPrinterEqual(P.constructors, E.Maybe, [
          'export const nothing: Maybe<never> = { type: "Nothing" };',
          'export function just<A>(value: A): Maybe<A> { return { type: "Just", value }; }'
        ])
      })

      it('nullary constructors', () => {
        assertPrinterEqual(P.constructors, E.FooBarBaz, [
          'export const foo: FooBarBaz = { type: "Foo" };',
          'export const bar: FooBarBaz = { type: "Bar" };',
          'export const baz: FooBarBaz = { type: "Baz" };'
        ])
      })

      it('monomorphic constructors', () => {
        assertPrinterEqual(P.constructors, E.User, [
          'export function user(name: string, surname: string, age: number): User { return { name, surname, age }; }'
        ])
      })

      it('monomorphic nullary constructor', () => {
        assertPrinterEqual(P.constructors, E.Nullary, ['export const nullary: Nullary = {};'])
      })

      it('constrained data', () => {
        assertPrinterEqual(P.constructors, E.Constrained, [
          'export const fetching: Constrained<string> = { type: "Fetching" };',
          'export function gotData<A extends string>(value0: A): Constrained<A> { return { type: "GotData", value0 }; }'
        ])
      })
    })
  })

  describe('fold', () => {
    it('positional fields', () => {
      assertPrinterEqual(
        P.fold,
        E.Option,
        'export function fold<A, R>(onNone: () => R, onSome: (value0: A) => R): (fa: Option<A>) => R { return fa => { switch (fa.type) {\n    case "None": return onNone();\n    case "Some": return onSome(fa.value0);\n} }; }'
      )
    })

    it('record fields', () => {
      assertPrinterEqual(
        P.fold,
        E.Maybe,
        'export function fold<A, R>(onNothing: () => R, onJust: (value: A) => R): (fa: Maybe<A>) => R { return fa => { switch (fa.type) {\n    case "Nothing": return onNothing();\n    case "Just": return onJust(fa.value);\n} }; }'
      )
    })

    it('should not emit a fold if data is not a sum type', () => {
      assertPrinterEqual(P.fold, E.User, '')
    })

    it('should choose a good return type parameter', () => {
      assertPrinterEqual(
        P.fold,
        E.Either,
        'export function fold<E, R, R1>(onLeft: (value0: E) => R1, onRight: (value0: R) => R1): (fa: Either<E, R>) => R1 { return fa => { switch (fa.type) {\n    case "Left": return onLeft(fa.value0);\n    case "Right": return onRight(fa.value0);\n} }; }'
      )
    })

    it('should handle monomorphic data', () => {
      assertPrinterEqual(
        P.fold,
        E.FooBarBaz,
        'export function fold<R>(onFoo: () => R, onBar: () => R, onBaz: () => R): (fa: FooBarBaz) => R { return fa => { switch (fa.type) {\n    case "Foo": return onFoo();\n    case "Bar": return onBar();\n    case "Baz": return onBaz();\n} }; }'
      )
    })
  })

  describe('prisms', () => {
    it('should handle non sum types', () => {
      assertPrinterEqual(P.prisms, E.User, [])
    })

    it('should handle monomorphic data', () => {
      assertPrinterEqual(P.prisms, E.FooBarBaz, [
        'import { Prism } from "monocle-ts";',
        'export const _Foo: Prism<FooBarBaz, FooBarBaz> = Prism.fromPredicate(s => s.type === "Foo");',
        'export const _Bar: Prism<FooBarBaz, FooBarBaz> = Prism.fromPredicate(s => s.type === "Bar");',
        'export const _Baz: Prism<FooBarBaz, FooBarBaz> = Prism.fromPredicate(s => s.type === "Baz");'
      ])
    })
  })

  describe('eq', () => {
    it('should handle monomorphic data', () => {
      assertPrinterEqual(P.eq, E.FooBarBaz, [
        'import { Eq, fromEquals } from "fp-ts/lib/Eq";',
        'export function getEq(): Eq<FooBarBaz> { return fromEquals((x, y) => { if (x.type === "Foo" && y.type === "Foo") {\n    return true;\n} if (x.type === "Bar" && y.type === "Bar") {\n    return true;\n} if (x.type === "Baz" && y.type === "Baz") {\n    return true;\n} return false; }); }'
      ])
    })

    it('should handle monomorphic nullary', () => {
      assertPrinterEqual(P.eq, E.Nullary, [])
    })

    it('should handle non sum types', () => {
      assertPrinterEqual(P.eq, E.User, [
        'import { Eq, fromEquals } from "fp-ts/lib/Eq";',
        'export function getEq(eqName: Eq<string>, eqSurname: Eq<string>, eqAge: Eq<number>): Eq<User> { return fromEquals((x, y) => { return eqName.equals(x.name, y.name) && eqSurname.equals(x.surname, y.surname) && eqAge.equals(x.age, y.age); }); }'
      ])
    })

    it('should handle recursive data structures', () => {
      assertPrinterEqual(P.eq, E.Tree, [
        'import { Eq, fromEquals } from "fp-ts/lib/Eq";',
        'export function getEq<A>(eqNodeValue1: Eq<A>): Eq<Tree<A>> { const S: Eq<Tree<A>> = fromEquals((x, y) => { if (x.type === "Leaf" && y.type === "Leaf") {\n    return true;\n} if (x.type === "Node" && y.type === "Node") {\n    return S.equals(x.value0, y.value0) && eqNodeValue1.equals(x.value1, y.value1) && S.equals(x.value2, y.value2);\n} return false; }); return S; }'
      ])
    })
  })

  describe('options', () => {
    it('should handle custom tag names', () => {
      const printer = P.print
      assert.strictEqual(
        printer(lenses.tagName.set('tag')(defaultOptions))(E.Option),
        `export type Option<A> = {
    readonly tag: "None";
} | {
    readonly tag: "Some";
    readonly value0: A;
};

export const none: Option<never> = { tag: "None" };

export function some<A>(value0: A): Option<A> { return { tag: "Some", value0 }; }

export function fold<A, R>(onNone: () => R, onSome: (value0: A) => R): (fa: Option<A>) => R { return fa => { switch (fa.tag) {
    case "None": return onNone();
    case "Some": return onSome(fa.value0);
} }; }

import { Prism } from "monocle-ts";

export function _none<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.tag === "None"); }

export function _some<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.tag === "Some"); }

import { Eq, fromEquals } from \"fp-ts/lib/Eq\";

export function getEq<A>(eqSomeValue0: Eq<A>): Eq<Option<A>> { return fromEquals((x, y) => { if (x.tag === "None" && y.tag === "None") {
    return true;
} if (x.tag === "Some" && y.tag === "Some") {
    return eqSomeValue0.equals(x.value0, y.value0);
} return false; }); }`
      )
    })

    it('should handle custom fold names', () => {
      assertPrinterEqual(
        P.fold,
        E.Option,
        `export function match<A, R>(onNone: () => R, onSome: (value0: A) => R): (fa: Option<A>) => R { return fa => { switch (fa.type) {
    case "None": return onNone();
    case "Some": return onSome(fa.value0);
} }; }`,
        lenses.foldName.set('match')(defaultOptions)
      )
    })

    it('should handle handlersName handlersStyle', () => {
      assertPrinterEqual(
        P.fold,
        E.Option,
        `export function fold<A, R>(clauses: {
    onNone: () => R;
    onSome: (value0: A) => R;
}): (fa: Option<A>) => R { return fa => { switch (fa.type) {
    case "None": return clauses.onNone();
    case "Some": return clauses.onSome(fa.value0);
} }; }`,
        lenses.handlersStyle.set({ type: 'record', handlersName: 'clauses' })(defaultOptions)
      )
    })
  })
})
