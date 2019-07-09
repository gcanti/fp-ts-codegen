export type User = {
    readonly name: string;
    readonly surname: string;
    readonly age: number;
};

export function user(name: string, surname: string, age: number): User { return { name, surname, age }; }



import { Eq, fromEquals } from "fp-ts/lib/Eq";

export function getEq(eqName: Eq<string>, eqSurname: Eq<string>, eqAge: Eq<number>): Eq<User> { return fromEquals((x, y) => { return eqName.equals(x.name, y.name) && eqSurname.equals(x.surname, y.surname) && eqAge.equals(x.age, y.age); }); }

