export type Either<E, R> = {
    readonly type: "Left";
    readonly value0: E;
} | {
    readonly type: "Right";
    readonly value0: R;
};

export function left<E, R>(value0: E): Either<E, R> { return { type: "Left", value0 }; }

export function right<E, R>(value0: R): Either<E, R> { return { type: "Right", value0 }; }

export function fold<E, R, R1>(onLeft: (value0: E) => R1, onRight: (value0: R) => R1): (fa: Either<E, R>) => R1 { return fa => { switch (fa.type) {
    case "Left": return onLeft(fa.value0);
    case "Right": return onRight(fa.value0);
} }; }

import { Prism } from "monocle-ts";

export function _left<E, R>(): Prism<Either<E, R>, Either<E, R>> { return Prism.fromPredicate(s => s.type === "Left"); }

export function _right<E, R>(): Prism<Either<E, R>, Either<E, R>> { return Prism.fromPredicate(s => s.type === "Right"); }

import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<E, R>(eqLeftValue0: Eq<E>, eqRightValue0: Eq<R>): Eq<Either<E, R>> { return fromEquals((x, y) => { if (x.type === "Left" && y.type === "Left") {
    return eqLeftValue0.equals(x.value0, y.value0);
} if (x.type === "Right" && y.type === "Right") {
    return eqRightValue0.equals(x.value0, y.value0);
} return false; }); }

