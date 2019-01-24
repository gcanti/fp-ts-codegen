export type FooBar = {
    readonly type: "Foo";
} | {
    readonly type: "Bar";
};

export const foo: FooBar = { type: "Foo" };

export const bar: FooBar = { type: "Bar" };

export function fold<R>(fa: FooBar, onFoo: R, onBar: R): R { switch (fa.type) {
    case "Foo": return onFoo;
    case "Bar": return onBar;
} }

export function foldL<R>(fa: FooBar, onFoo: () => R, onBar: () => R): R { switch (fa.type) {
    case "Foo": return onFoo();
    case "Bar": return onBar();
} }

