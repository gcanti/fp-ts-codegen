export type Writer<W, A> = {
    readonly value0: () => [A, W];
};

export function writer<W, A>(value0: () => [A, W]): Writer<W, A> { return { value0 }; }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid<W, A>(setoidValue0: Setoid<() => [A, W]>): Setoid<Writer<W, A>> { return fromEquals((x, y) => { return setoidValue0.equals(x.value0, y.value0); }); }

