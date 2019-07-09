export type NotAlignedNames = {
    readonly value: string;
};

export function ctor(value: string): NotAlignedNames { return { value }; }



import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq(eqValue: Eq<string>): Eq<NotAlignedNames> { return fromEquals((x, y) => { return eqValue.equals(x.value, y.value); }); }

