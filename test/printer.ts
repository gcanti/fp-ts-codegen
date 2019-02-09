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
          M.constructor('Tuple', [M.member(M.fun(M.tuple([M.ref('A'), M.ref('B')]), M.ref('C')))])
        )
        assertPrinterEqual(
          P.data,
          data,
          `export type Tuple = {
    readonly type: "Tuple";
    readonly value0: (tuple: [A, B]) => C;
};`
        )
      })

      it('function domain', () => {
        const data = M.data(
          'Function',
          [],
          M.constructor('Function', [M.member(M.fun(M.fun(M.ref('A'), M.ref('B')), M.ref('C')))])
        )
        assertPrinterEqual(
          P.data,
          data,
          `export type Function = {
    readonly type: "Function";
    readonly value0: (f: (a: A) => B) => C;
};`
        )
      })

      it('tuple field', () => {
        assertPrinterEqual(
          P.data,
          E.Tuple2,
          `export type Tuple2<A, B> = {
    readonly type: "Tuple2";
    readonly value0: [A, B];
};`
        )
      })

      it('unit field', () => {
        const data = M.data('Unit', [], M.constructor('Unit', [M.member(M.unit)]))
        assertPrinterEqual(
          P.data,
          data,
          `export type Unit = {
    readonly type: "Unit";
    readonly value0: undefined;
};`
        )
      })

      it('function fields', () => {
        assertPrinterEqual(
          P.data,
          E.Writer,
          `export type Writer<W, A> = {
    readonly type: "Writer";
    readonly value0: () => [A, W];
};`
        )
        assertPrinterEqual(
          P.data,
          E.State,
          `export type State<S, A> = {
    readonly type: "State";
    readonly value0: (s: S) => [A, S];
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
          'export function left<L, R>(value0: L): Either<L, R> { return { type: "Left", value0 }; }',
          'export function right<L, R>(value0: R): Either<L, R> { return { type: "Right", value0 }; }'
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
          'export function user(name: string, surname: string, age: number): User { return { type: "User", name, surname, age }; }'
        ])
      })
    })
  })

  const fptsEncodingOptions = lenses.encoding.set('fp-ts')(defaultOptions)

  describe('fp-ts encoding', () => {
    describe('data', () => {
      it('non a sum type', () => {
        assertPrinterEqual(
          P.data,
          E.User,
          `declare module "fp-ts/lib/HKT" {
    interface  {
        User: User;
    }
}

export const URI = "User";

export type URI = typeof URI;

export type User = User;

export class User {
    readonly _tag: "User" = "User";
    readonly _URI!: URI;
    constructor(readonly name: string, readonly surname: string, readonly age: number) { }
}`,
          fptsEncodingOptions
        )
      })

      it('eager fold not supported', () => {
        assertPrinterEqual(
          P.data,
          E.Either,
          `declare module "fp-ts/lib/HKT" {
    interface URI2HKT2<L, A> {
        Either: Either<L, A>;
    }
}

export const URI = "Either";

export type URI = typeof URI;

export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> {
    readonly _tag: "Left" = "Left";
    readonly _A!: A;
    readonly _L!: L;
    readonly _URI!: URI;
    constructor(readonly value0: L) { }
    fold<R1>(onLeft: (value0: L) => R1, _onRight: (value0: R) => R1): R1 { return onLeft(this.value0); }
}

export class Right<L, R> {
    readonly _tag: "Right" = "Right";
    readonly _A!: A;
    readonly _L!: L;
    readonly _URI!: URI;
    constructor(readonly value0: R) { }
    fold<R1>(_onLeft: (value0: L) => R1, onRight: (value0: R) => R1): R1 { return onRight(this.value0); }
}`,
          fptsEncodingOptions
        )
      })

      it('unconstrained data', () => {
        assertPrinterEqual(
          P.data,
          E.Option,
          `declare module "fp-ts/lib/HKT" {
    interface URI2HKT<A> {
        Option: Option<A>;
    }
}

export const URI = "Option";

export type URI = typeof URI;

export type Option<A> = None<A> | Some<A>;

export class None<A> {
    static value: Option<never> = new None();
    readonly _tag: "None" = "None";
    readonly _A!: A;
    readonly _URI!: URI;
    private constructor() { }
    fold<R>(onNone: R, _onSome: (value0: A) => R): R { return onNone; }
    foldL<R>(onNone: () => R, _onSome: (value0: A) => R): R { return onNone(); }
}

export class Some<A> {
    readonly _tag: "Some" = "Some";
    readonly _A!: A;
    readonly _URI!: URI;
    constructor(readonly value0: A) { }
    fold<R>(_onNone: R, onSome: (value0: A) => R): R { return onSome(this.value0); }
    foldL<R>(_onNone: () => R, onSome: (value0: A) => R): R { return onSome(this.value0); }
}`,
          fptsEncodingOptions
        )
      })

      it('constrained data', () => {
        assertPrinterEqual(
          P.data,
          E.Constrained,
          `declare module "fp-ts/lib/HKT" {
    interface URI2HKT<A> {
        Constrained: Constrained<A>;
    }
}

export const URI = "Constrained";

export type URI = typeof URI;

export type Constrained<A extends string> = Fetching<A> | GotData<A>;

export class Fetching<A extends string> {
    static value: Constrained<never> = new Fetching();
    readonly _tag: "Fetching" = "Fetching";
    readonly _A!: A;
    readonly _URI!: URI;
    private constructor() { }
    fold<R>(onFetching: R, _onGotData: (value0: A) => R): R { return onFetching; }
    foldL<R>(onFetching: () => R, _onGotData: (value0: A) => R): R { return onFetching(); }
}

export class GotData<A extends string> {
    readonly _tag: "GotData" = "GotData";
    readonly _A!: A;
    readonly _URI!: URI;
    constructor(readonly value0: A) { }
    fold<R>(_onFetching: R, onGotData: (value0: A) => R): R { return onGotData(this.value0); }
    foldL<R>(_onFetching: () => R, onGotData: (value0: A) => R): R { return onGotData(this.value0); }
}`,
          fptsEncodingOptions
        )
      })
    })

    describe('constructors', () => {
      it('unconstrained data', () => {
        assertPrinterEqual(
          P.constructors,
          E.Option,
          [
            'export const none: Option<never> = None.value;',
            'export function some<A>(value0: A): Option<A> { return new Some(value0); }'
          ],
          fptsEncodingOptions
        )
      })

      it('constrained data', () => {
        assertPrinterEqual(
          P.constructors,
          E.Constrained,
          [
            'export const fetching: Constrained<string> = Fetching.value;',
            'export function gotData<A extends string>(value0: A): Constrained<A> { return new GotData(value0); }'
          ],
          fptsEncodingOptions
        )
      })
    })

    describe('folds', () => {
      it('should not output any fold function', () => {
        assertPrinterEqual(P.fold, E.Option, [], fptsEncodingOptions)
      })
    })
  })

  describe('fold', () => {
    it('positional fields', () => {
      assertPrinterEqual(P.fold, E.Option, [
        'export function fold<A, R>(fa: Option<A>, onNone: R, onSome: (value0: A) => R): R { switch (fa.type) {\n    case "None": return onNone;\n    case "Some": return onSome(fa.value0);\n} }',
        'export function foldL<A, R>(fa: Option<A>, onNone: () => R, onSome: (value0: A) => R): R { switch (fa.type) {\n    case "None": return onNone();\n    case "Some": return onSome(fa.value0);\n} }'
      ])
    })

    it('record fields', () => {
      assertPrinterEqual(P.fold, E.Maybe, [
        'export function fold<A, R>(fa: Maybe<A>, onNothing: R, onJust: (value: A) => R): R { switch (fa.type) {\n    case "Nothing": return onNothing;\n    case "Just": return onJust(fa.value);\n} }',
        'export function foldL<A, R>(fa: Maybe<A>, onNothing: () => R, onJust: (value: A) => R): R { switch (fa.type) {\n    case "Nothing": return onNothing();\n    case "Just": return onJust(fa.value);\n} }'
      ])
    })

    it('should not emit a fold if data is not a sum type', () => {
      assertPrinterEqual(P.fold, E.User, [])
    })

    it('should not emit a fold if all constructors are not nullary', () => {
      assertPrinterEqual(P.fold, E.Either, [
        'export function fold<L, R, R1>(fa: Either<L, R>, onLeft: (value0: L) => R1, onRight: (value0: R) => R1): R1 { switch (fa.type) {\n    case "Left": return onLeft(fa.value0);\n    case "Right": return onRight(fa.value0);\n} }'
      ])
    })

    it('should handle monomorphic data', () => {
      assertPrinterEqual(P.fold, E.FooBarBaz, [
        'export function fold<R>(fa: FooBarBaz, onFoo: R, onBar: R, onBaz: R): R { switch (fa.type) {\n    case "Foo": return onFoo;\n    case "Bar": return onBar;\n    case "Baz": return onBaz;\n} }',
        'export function foldL<R>(fa: FooBarBaz, onFoo: () => R, onBar: () => R, onBaz: () => R): R { switch (fa.type) {\n    case "Foo": return onFoo();\n    case "Bar": return onBar();\n    case "Baz": return onBaz();\n} }'
      ])
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

  describe('setoid', () => {
    it('should handle monomorphic data', () => {
      assertPrinterEqual(P.setoid, E.FooBarBaz, [
        'import { Setoid } from "fp-ts/lib/Setoid";',
        'export function getSetoid(): Setoid<FooBarBaz> { return { equals: (x, y) => { if (x === y) {\n        return true;\n    } if (x.type === "Foo" && y.type === "Foo") {\n        return true;\n    } if (x.type === "Bar" && y.type === "Bar") {\n        return true;\n    } if (x.type === "Baz" && y.type === "Baz") {\n        return true;\n    } return false; } }; }'
      ])
    })

    it('should handle non sum types', () => {
      assertPrinterEqual(P.setoid, E.User, [
        'import { Setoid } from "fp-ts/lib/Setoid";',
        'export function getSetoid(setoidName: Setoid<string>, setoidSurname: Setoid<string>, setoidAge: Setoid<number>): Setoid<User> { return { equals: (x, y) => { if (x === y) {\n        return true;\n    } return setoidName.equals(x.name, y.name) && setoidSurname.equals(x.surname, y.surname) && setoidAge.equals(x.age, y.age); } }; }'
      ])
    })

    it('should handle recursive data structures', () => {
      assertPrinterEqual(P.setoid, E.Tree, [
        'import { Setoid } from "fp-ts/lib/Setoid";',
        'export function getSetoid<A>(setoidNodeValue1: Setoid<A>): Setoid<Tree<A>> { const S: Setoid<Tree<A>> = { equals: (x, y) => { if (x === y) {\n        return true;\n    } if (x.type === "Leaf" && y.type === "Leaf") {\n        return true;\n    } if (x.type === "Node" && y.type === "Node") {\n        return S.equals(x.value0, y.value0) && setoidNodeValue1.equals(x.value1, y.value1) && S.equals(x.value2, y.value2);\n    } return false; } }; return S; }'
      ])
    })
  })

  describe('options', () => {
    it('should handle custom tag names', () => {
      const printer = P.print
      assert.strictEqual(
        printer(E.Option, lenses.tagName.set('tag')(defaultOptions)),
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
} }

import { Prism } from "monocle-ts";

export function _none<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.tag === "None"); }

export function _some<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.tag === "Some"); }

import { Setoid } from "fp-ts/lib/Setoid";

export function getSetoid<A>(setoidSomeValue0: Setoid<A>): Setoid<Option<A>> { return { equals: (x, y) => { if (x === y) {
        return true;
    } if (x.tag === "None" && y.tag === "None") {
        return true;
    } if (x.tag === "Some" && y.tag === "Some") {
        return setoidSomeValue0.equals(x.value0, y.value0);
    } return false; } }; }`
      )
    })

    it('should handle custom fold names', () => {
      assertPrinterEqual(
        P.fold,
        E.Option,
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
      assertPrinterEqual(
        P.fold,
        E.Option,
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

    it('should handle handlersName handlersStyle', () => {
      assertPrinterEqual(
        P.fold,
        E.Option,
        [
          `export function fold<A, R>(fa: Option<A>, clauses: {
    onNone: R;
    onSome: (value0: A) => R;
}): R { switch (fa.type) {
    case "None": return clauses.onNone;
    case "Some": return clauses.onSome(fa.value0);
} }`,
          `export function foldL<A, R>(fa: Option<A>, clauses: {
    onNone: () => R;
    onSome: (value0: A) => R;
}): R { switch (fa.type) {
    case "None": return clauses.onNone();
    case "Some": return clauses.onSome(fa.value0);
} }`
        ],
        lenses.handlersStyle.set({ type: 'record', handlersName: 'clauses' })(defaultOptions)
      )
    })

    describe('version', () => {
      it('should output different implementation of setoid', () => {
        assertPrinterEqual(
          P.setoid,
          E.Option,
          [
            'import { Setoid } from "fp-ts/lib/Setoid";',
            'export function getSetoid<A>(setoidSomeValue0: Setoid<A>): Setoid<Option<A>> { return { equals: (x, y) => { if (x === y) {\n        return true;\n    } if (x.type === "None" && y.type === "None") {\n        return true;\n    } if (x.type === "Some" && y.type === "Some") {\n        return setoidSomeValue0.equals(x.value0, y.value0);\n    } return false; } }; }'
          ],
          lenses.version.set('1.13')(defaultOptions)
        )
        assertPrinterEqual(
          P.setoid,
          E.Option,
          [
            'import { Setoid, fromEquals } from "fp-ts/lib/Setoid";',
            'export function getSetoid<A>(setoidSomeValue0: Setoid<A>): Setoid<Option<A>> { return fromEquals((x, y) => { if (x.type === "None" && y.type === "None") {\n    return true;\n} if (x.type === "Some" && y.type === "Some") {\n    return setoidSomeValue0.equals(x.value0, y.value0);\n} return false; }); }'
          ],
          lenses.version.set('1.14')(defaultOptions)
        )
      })
    })
  })
})
