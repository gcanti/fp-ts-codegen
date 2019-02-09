export type State<S, A> = {
    readonly type: "State";
    readonly value0: (s: S) => [A, S];
};

export function state<S, A>(value0: (s: S) => [A, S]): State<S, A> { return { type: "State", value0 }; }

import { Setoid } from "fp-ts/lib/Setoid";

export function getSetoid<S, A>(setoidValue0: Setoid<(s: S) => [A, S]>): Setoid<State<S, A>> { return { equals: (x, y) => { if (x === y) {
        return true;
    } return setoidValue0.equals(x.value0, y.value0); } }; }

