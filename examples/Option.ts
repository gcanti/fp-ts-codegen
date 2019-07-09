export type Option<A> = {
    readonly type: "None";
} | {
    readonly type: "Some";
    readonly value0: A;
};

export const none: Option<never> = { type: "None" };

export function some<A>(value0: A): Option<A> { return { type: "Some", value0 }; }

export function fold<A, R>(onNone: () => R, onSome: (value0: A) => R): (fa: Option<A>) => R { return fa => { switch (fa.type) {
    case "None": return onNone();
    case "Some": return onSome(fa.value0);
} }; }

import { Prism } from "monocle-ts";

export function _none<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.type === "None"); }

export function _some<A>(): Prism<Option<A>, Option<A>> { return Prism.fromPredicate(s => s.type === "Some"); }

import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<A>(eqSomeValue0: Eq<A>): Eq<Option<A>> { return fromEquals((x, y) => { if (x.type === "None" && y.type === "None") {
    return true;
} if (x.type === "Some" && y.type === "Some") {
    return eqSomeValue0.equals(x.value0, y.value0);
} return false; }); }

