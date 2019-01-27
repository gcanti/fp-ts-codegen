export type Writer<W, A> = {
    readonly type: "Writer";
    readonly value0: () => [A, W];
};

export function writer<W, A>(value0: () => [A, W]): Writer<W, A> { return { type: "Writer", value0 }; }

