export type Constrained<A extends string> = {
    readonly type: "Fetching";
} | {
    readonly type: "GotData";
    readonly value0: A;
};

export const fetching: Constrained<string> = { type: "Fetching" };

export function gotData<A extends string>(value0: A): Constrained<A> { return { type: "GotData", value0 }; }

export function fold<A extends string, R>(onFetching: () => R, onGotData: (value0: A) => R): (fa: Constrained<A>) => R { return fa => { switch (fa.type) {
    case "Fetching": return onFetching();
    case "GotData": return onGotData(fa.value0);
} }; }

import { Prism } from "monocle-ts";

export function _fetching<A extends string>(): Prism<Constrained<A>, Constrained<A>> { return Prism.fromPredicate(s => s.type === "Fetching"); }

export function _gotData<A extends string>(): Prism<Constrained<A>, Constrained<A>> { return Prism.fromPredicate(s => s.type === "GotData"); }

import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<A extends string>(eqGotDataValue0: Eq<A>): Eq<Constrained<A>> { return fromEquals((x, y) => { if (x.type === "Fetching" && y.type === "Fetching") {
    return true;
} if (x.type === "GotData" && y.type === "GotData") {
    return eqGotDataValue0.equals(x.value0, y.value0);
} return false; }); }

