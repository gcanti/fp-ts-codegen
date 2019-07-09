export type Tree<A> = {
    readonly type: "Leaf";
} | {
    readonly type: "Node";
    readonly value0: Tree<A>;
    readonly value1: A;
    readonly value2: Tree<A>;
};

export const leaf: Tree<never> = { type: "Leaf" };

export function node<A>(value0: Tree<A>, value1: A, value2: Tree<A>): Tree<A> { return { type: "Node", value0, value1, value2 }; }

export function fold<A, R>(onLeaf: () => R, onNode: (value0: Tree<A>, value1: A, value2: Tree<A>) => R): (fa: Tree<A>) => R { return fa => { switch (fa.type) {
    case "Leaf": return onLeaf();
    case "Node": return onNode(fa.value0, fa.value1, fa.value2);
} }; }

import { Prism } from "monocle-ts";

export function _leaf<A>(): Prism<Tree<A>, Tree<A>> { return Prism.fromPredicate(s => s.type === "Leaf"); }

export function _node<A>(): Prism<Tree<A>, Tree<A>> { return Prism.fromPredicate(s => s.type === "Node"); }

import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq<A>(eqNodeValue1: Eq<A>): Eq<Tree<A>> { const S: Eq<Tree<A>> = fromEquals((x, y) => { if (x.type === "Leaf" && y.type === "Leaf") {
    return true;
} if (x.type === "Node" && y.type === "Node") {
    return S.equals(x.value0, y.value0) && eqNodeValue1.equals(x.value1, y.value1) && S.equals(x.value2, y.value2);
} return false; }); return S; }

