export type Tuple2<A, B> = {
    readonly type: "Tuple2";
    readonly value0: [A, B];
};

export function tuple2<A, B>(value0: [A, B]): Tuple2<A, B> { return { type: "Tuple2", value0 }; }

