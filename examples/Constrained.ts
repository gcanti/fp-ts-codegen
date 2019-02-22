export type Constrained<A extends string> = {
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

export function _gotData<A extends string>(): Prism<Constrained<A>, Constrained<A>> { return Prism.fromPredicate(s => s.type === "GotData"); }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid<A extends string>(setoidGotDataValue0: Setoid<A>): Setoid<Constrained<A>> { return fromEquals((x, y) => { if (x.type === "Fetching" && y.type === "Fetching") {
    return true;
} if (x.type === "GotData" && y.type === "GotData") {
    return setoidGotDataValue0.equals(x.value0, y.value0);
} return false; }); }

