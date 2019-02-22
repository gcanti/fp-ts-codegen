export type User = {
    readonly name: string;
    readonly surname: string;
    readonly age: number;
};

export function user(name: string, surname: string, age: number): User { return { name, surname, age }; }

import { Setoid, fromEquals } from "fp-ts/lib/Setoid";

export function getSetoid(setoidName: Setoid<string>, setoidSurname: Setoid<string>, setoidAge: Setoid<number>): Setoid<User> { return fromEquals((x, y) => { return setoidName.equals(x.name, y.name) && setoidSurname.equals(x.surname, y.surname) && setoidAge.equals(x.age, y.age); }); }

