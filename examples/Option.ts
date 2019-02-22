export type Option<A> = {
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

export function _some<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.type === "Some"); }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid<A>(setoidSomeValue0: Setoid<A>): Setoid<Option<A>> { return fromEquals((x, y) => { if (x.type === "None" && y.type === "None") {
    return true;
} if (x.type === "Some" && y.type === "Some") {
    return setoidSomeValue0.equals(x.value0, y.value0);
} return false; }); }

