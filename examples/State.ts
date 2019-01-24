export type State<S, A> = {
    readonly type: "State";
    readonly value0: (s: S) => [A, S];
};

export function state<S, A>(value0: (s: S) => [A, S]): State<S, A> { return { type: "State", value0 }; }

