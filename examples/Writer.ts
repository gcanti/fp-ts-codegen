export type Writer<W, A> = {
    readonly value0: () => [A, W];
};

export function writer<W, A>(value0: () => [A, W]): Writer<W, A> { return { value0 }; }



import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<W, A>(eqValue0: Eq<() => [A, W]>): Eq<Writer<W, A>> { return fromEquals((x, y) => { return eqValue0.equals(x.value0, y.value0); }); }

