export type Maybe<A> = {
    readonly type: "Nothing";
} | {
    readonly type: "Just";
    readonly value: A;
};

export const nothing: Maybe<never> = { type: "Nothing" };

export function just<A>(value: A): Maybe<A> { return { type: "Just", value }; }

export function fold<A, R>(onNothing: () => R, onJust: (value: A) => R): (fa: Maybe<A>) => R { return fa => { switch (fa.type) {
    case "Nothing": return onNothing();
    case "Just": return onJust(fa.value);
} }; }

import { Prism } from "monocle-ts";

export function _nothing<A>(): Prism<Maybe<A>, Maybe<A>> { return Prism.fromPredicate(s => s.type === "Nothing"); }

export function _just<A>(): Prism<Maybe<A>, Maybe<A>> { return Prism.fromPredicate(s => s.type === "Just"); }

import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<A>(eqJustValue: Eq<A>): Eq<Maybe<A>> { return fromEquals((x, y) => { if (x.type === "Nothing" && y.type === "Nothing") {
    return true;
} if (x.type === "Just" && y.type === "Just") {
    return eqJustValue.equals(x.value, y.value);
} return false; }); }

