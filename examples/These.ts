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

export function fold<A, B, R>(onLeft: (left: A) => R, onRight: (right: B) => R, onBoth: (left: A, right: B) => R): (fa: These<A, B>) => R { return fa => { switch (fa.type) {
    case "Left": return onLeft(fa.left);
    case "Right": return onRight(fa.right);
    case "Both": return onBoth(fa.left, fa.right);
} }; }

import { Prism } from "monocle-ts";

export function _left<A, B>(): Prism<These<A, B>, These<A, B>> { return Prism.fromPredicate(s => s.type === "Left"); }

export function _right<A, B>(): Prism<These<A, B>, These<A, B>> { return Prism.fromPredicate(s => s.type === "Right"); }

export function _both<A, B>(): Prism<These<A, B>, These<A, B>> { return Prism.fromPredicate(s => s.type === "Both"); }

import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<A, B>(eqLeftLeft: Eq<A>, eqRightRight: Eq<B>, eqBothLeft: Eq<A>, eqBothRight: Eq<B>): Eq<These<A, B>> { return fromEquals((x, y) => { if (x.type === "Left" && y.type === "Left") {
    return eqLeftLeft.equals(x.left, y.left);
} if (x.type === "Right" && y.type === "Right") {
    return eqRightRight.equals(x.right, y.right);
} if (x.type === "Both" && y.type === "Both") {
    return eqBothLeft.equals(x.left, y.left) && eqBothRight.equals(x.right, y.right);
} return false; }); }

