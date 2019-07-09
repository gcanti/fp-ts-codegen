export type State<S, A> = {
    readonly value0: (s: S) => [A, S];
};

export function state<S, A>(value0: (s: S) => [A, S]): State<S, A> { return { value0 }; }



import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<S, A>(eqValue0: Eq<(s: S) => [A, S]>): Eq<State<S, A>> { return fromEquals((x, y) => { return eqValue0.equals(x.value0, y.value0); }); }

