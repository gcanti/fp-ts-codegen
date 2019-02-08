import * as assert from 'assert'
import { defaultOptions, lenses } from '../../src/ast'
import * as M from '../../src/model'
import * as P from '../../src/printer'
import * as E from '../examples'
import { assertPrinterEqual } from '../helpers'

const fptsEncodingOptions = lenses.encoding.set('fp-ts')(defaultOptions)

describe('[printer] fp-ts encoding', () => {
  it('Option', () => {
    assert.strictEqual(
      P.print(E.Option, fptsEncodingOptions),
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
}

export const none: Option<never> = None.value;

export function some<A>(value0: A): Option<A> { return new Some(value0); }

import { Prism } from "monocle-ts";

export function _none<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.type === "None"); }

export function _some<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.type === "Some"); }`
    )
  })

  it('Either', () => {
    assert.strictEqual(
      P.print(E.Either, fptsEncodingOptions),
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
}

export function left<L, R>(value0: L): Either<L, R> { return new Left(value0); }

export function right<L, R>(value0: R): Either<L, R> { return new Right(value0); }

import { Prism } from "monocle-ts";

export function _left<L, R>(): Prism<Either<L, R>, Either<L, R>> { return Prism.fromPredicate(s => s.type === "Left"); }

export function _right<L, R>(): Prism<Either<L, R>, Either<L, R>> { return Prism.fromPredicate(s => s.type === "Right"); }`
    )
  })

  it('should switch to literal encoding if there are too many type parameters', () => {
    assertPrinterEqual(
      P.data,
      M.data(
        'TooMany',
        [
          M.parameterDeclaration('Z'),
          M.parameterDeclaration('X'),
          M.parameterDeclaration('U'),
          M.parameterDeclaration('L'),
          M.parameterDeclaration('A')
        ],
        M.constructor('TooMany')
      ),
      `export type TooMany<Z, X, U, L, A> = {
    readonly type: "TooMany";
};`,
      fptsEncodingOptions
    )
  })

  it('Constrained', () => {
    assert.strictEqual(
      P.print(E.Constrained, fptsEncodingOptions),
      `declare module "fp-ts/lib/HKT" {
    interface URI2HKT<A> {
        Constrained: Constrained<A>;
    }
}

export const URI = "Constrained";

export type URI = typeof URI;

export type Constrained<A extends string> = Fetching<A> | GotData<A>;

export class Fetching<A> {
    static value: Constrained<never> = new Fetching();
    readonly _tag: "Fetching" = "Fetching";
    readonly _A!: A;
    readonly _URI!: URI;
    private constructor() { }
    fold<R>(onFetching: R, _onGotData: (value0: A) => R): R { return onFetching; }
    foldL<R>(onFetching: () => R, _onGotData: (value0: A) => R): R { return onFetching(); }
}

export class GotData<A> {
    readonly _tag: "GotData" = "GotData";
    readonly _A!: A;
    readonly _URI!: URI;
    constructor(readonly value0: A) { }
    fold<R>(_onFetching: R, onGotData: (value0: A) => R): R { return onGotData(this.value0); }
    foldL<R>(_onFetching: () => R, onGotData: (value0: A) => R): R { return onGotData(this.value0); }
}

export const fetching: Constrained<string> = Fetching.value;

export function gotData<A extends string>(value0: A): Constrained<A> { return new GotData(value0); }

import { Prism } from "monocle-ts";

export function _fetching<A extends string>(): Prism<Constrained<A>, Constrained<A>> { return Prism.fromPredicate(s => s.type === "Fetching"); }

export function _gotData<A extends string>(): Prism<Constrained<A>, Constrained<A>> { return Prism.fromPredicate(s => s.type === "GotData"); }`
    )
  })

  it('Writer', () => {
    assert.strictEqual(
      P.print(E.Writer, fptsEncodingOptions),
      `declare module "fp-ts/lib/HKT" {
    interface URI2HKT2<L, A> {
        Writer: Writer<L, A>;
    }
}

export const URI = "Writer";

export type URI = typeof URI;

export type Writer<W, A> = Writer<W, A>;

export class Writer<W, A> {
    readonly _tag: "Writer" = "Writer";
    readonly _A!: A;
    readonly _L!: L;
    readonly _URI!: URI;
    constructor(readonly value0: () => [A, W]) { }
}

export function writer<W, A>(value0: () => [A, W]): Writer<W, A> { return new Writer(value0); }`
    )
  })
})
