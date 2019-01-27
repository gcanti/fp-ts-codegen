import * as assert from 'assert'
import { defaultOptions, lenses } from '../../src/ast'
import * as P from '../../src/printer'
import * as E from '../examples'
import { assertPrinterEqual } from '../helpers'

describe('[printer] options', () => {
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
} }`
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

  it('should handle handlersName + handlersStyle', () => {
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
})
