export type Either<L, R> = {
    readonly type: "Left";
    readonly value0: L;
} | {
    readonly type: "Right";
    readonly value0: R;
};

export function left<L, R>(value0: L): Either<L, R> { return { type: "Left", value0 }; }

export function right<L, R>(value0: R): Either<L, R> { return { type: "Right", value0 }; }

export function fold<L, R, R1>(fa: Either<L, R>, onLeft: (value0: L) => R1, onRight: (value0: R) => R1): R1 { switch (fa.type) {
    case "Left": return onLeft(fa.value0);
    case "Right": return onRight(fa.value0);
} }

import { Prism } from "monocle-ts";

export function _left<L, R>(): Prism<Either<L, R>, Either<L, R>> { return Prism.fromPredicate(s => s.type === "Left"); }

export function _right<L, R>(): Prism<Either<L, R>, Either<L, R>> { return Prism.fromPredicate(s => s.type === "Right"); }

