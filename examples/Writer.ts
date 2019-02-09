export type Writer<W, A> = {
    readonly type: "Writer";
    readonly value0: () => [A, W];
};

export function writer<W, A>(value0: () => [A, W]): Writer<W, A> { return { type: "Writer", value0 }; }

import { Setoid } from "fp-ts/lib/Setoid";

export function getSetoid<W, A>(setoidValue0: Setoid<() => [A, W]>): Setoid<Writer<W, A>> { return { equals: (x, y) => { if (x === y) {
        return true;
    } return setoidValue0.equals(x.value0, y.value0); } }; }

