export type Tuple2<A, B> = {
    readonly value0: [A, B];
};

export function tuple2<A, B>(value0: [A, B]): Tuple2<A, B> { return { value0 }; }



import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<A, B>(eqValue0: Eq<[A, B]>): Eq<Tuple2<A, B>> { return fromEquals((x, y) => { return eqValue0.equals(x.value0, y.value0); }); }

