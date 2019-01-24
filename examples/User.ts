export type User = {
    readonly type: "User";
    readonly name: string;
    readonly surname: string;
};

export function user(name: string, surname: string): User { return { type: "User", name, surname }; }

