export type State<S, A> = {
    readonly value0: (s: S) => [A, S];
};

export function state<S, A>(value0: (s: S) => [A, S]): State<S, A> { return { value0 }; }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid<S, A>(setoidValue0: Setoid<(s: S) => [A, S]>): Setoid<State<S, A>> { return fromEquals((x, y) => { return setoidValue0.equals(x.value0, y.value0); }); }

