export type These<A, B> = {
    readonly type: "Left";
    readonly left: A;
} | {
    readonly type: "Right";
    readonly right: B;
} | {
    readonly type: "Both";
    readonly left: A;
    readonly right: B;
};

export function left<A, B>(left: A): These<A, B> { return { type: "Left", left }; }

export function right<A, B>(right: B): These<A, B> { return { type: "Right", right }; }

export function both<A, B>(left: A, right: B): These<A, B> { return { type: "Both", left, right }; }

export function fold<A, B, R>(fa: These<A, B>, onLeft: (left: A) => R, onRight: (right: B) => R, onBoth: (left: A, right: B) => R): R { switch (fa.type) {
    case "Left": return onLeft(fa.left);
    case "Right": return onRight(fa.right);
    case "Both": return onBoth(fa.left, fa.right);
} }

import { Prism } from "monocle-ts";

export function _left<A, B>(): Prism<These<A, B>, These<A, B>> { return Prism.fromPredicate(s => s.type === "Left"); }

export function _right<A, B>(): Prism<These<A, B>, These<A, B>> { return Prism.fromPredicate(s => s.type === "Right"); }

export function _both<A, B>(): Prism<These<A, B>, These<A, B>> { return Prism.fromPredicate(s => s.type === "Both"); }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid<A, B>(setoidLeftLeft: Setoid<A>, setoidRightRight: Setoid<B>, setoidBothLeft: Setoid<A>, setoidBothRight: Setoid<B>): Setoid<These<A, B>> { return fromEquals((x, y) => { if (x.type === "Left" && y.type === "Left") {
    return setoidLeftLeft.equals(x.left, y.left);
} if (x.type === "Right" && y.type === "Right") {
    return setoidRightRight.equals(x.right, y.right);
} if (x.type === "Both" && y.type === "Both") {
    return setoidBothLeft.equals(x.left, y.left) && setoidBothRight.equals(x.right, y.right);
} return false; }); }

