export type Tuple2<A, B> = {
    readonly type: "Tuple2";
    readonly value0: [A, B];
};

export function tuple2<A, B>(value0: [A, B]): Tuple2<A, B> { return { type: "Tuple2", value0 }; }

import { Setoid } from "fp-ts/lib/Setoid";

export function getSetoid<A, B>(setoidValue0: Setoid<[A, B]>): Setoid<Tuple2<A, B>> { return { equals: (x, y) => { if (x === y) {
        return true;
    } return setoidValue0.equals(x.value0, y.value0); } }; }

