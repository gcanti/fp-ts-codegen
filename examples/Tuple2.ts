export type Tuple2<A, B> = {
    readonly value0: [A, B];
};

export function tuple2<A, B>(value0: [A, B]): Tuple2<A, B> { return { value0 }; }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid<A, B>(setoidValue0: Setoid<[A, B]>): Setoid<Tuple2<A, B>> { return fromEquals((x, y) => { return setoidValue0.equals(x.value0, y.value0); }); }

