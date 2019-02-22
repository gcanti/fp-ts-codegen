export type NotAlignedNames = {
    readonly value: string;
};

export function ctor(value: string): NotAlignedNames { return { value }; }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid(setoidValue: Setoid<string>): Setoid<NotAlignedNames> { return fromEquals((x, y) => { return setoidValue.equals(x.value, y.value); }); }

