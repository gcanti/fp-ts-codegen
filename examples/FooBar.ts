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

import { Prism } from "monocle-ts";

export const _Foo: Prism<FooBar, FooBar> = Prism.fromPredicate(s => s.type === "Foo");

export const _Bar: Prism<FooBar, FooBar> = Prism.fromPredicate(s => s.type === "Bar");

