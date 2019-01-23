import { none } from 'fp-ts/lib/Option'
import { Reader, reader } from 'fp-ts/lib/Reader'
import { array, empty } from 'fp-ts/lib/Array'
import * as ts from 'typescript'
import * as M from './model'

export interface Options {
  tag: string
}

export const defaultOptions: Options = {
  tag: 'type'
}

export interface AST<A> extends Reader<Options, A> {}

const getMemberName = (m: M.Member, position: number): string => {
  return m.name.getOrElseL(() => `value${position}`)
}

const getType = (t: M.Type): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(t.name, t.parameters.map(p => getType(p)))
}

export const data = (d: M.Data): AST<ts.TypeAliasDeclaration> => {
  return new Reader(e => {
    const type = ts.createUnionTypeNode(
      d.constructors.toArray().map(c => {
        const tag: ts.TypeElement = ts.createPropertySignature(
          [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
          e.tag,
          undefined,
          ts.createLiteralTypeNode(ts.createLiteral(c.name)),
          undefined
        )
        const members: Array<ts.TypeElement> = c.members.map((m, position) => {
          return ts.createPropertySignature(
            [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
            getMemberName(m, position),
            undefined,
            getType(m.type),
            undefined
          )
        })
        return ts.createTypeLiteralNode([tag, ...members])
      })
    )
    return ts.createTypeAliasDeclaration(
      undefined,
      [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      d.introduction.name,
      d.introduction.parameters.map(p =>
        ts.createTypeParameterDeclaration(p.name, p.constraint.map(getType).toUndefined())
      ),
      type
    )
  })
}

const getConstructorName = (name: string): string => {
  return name.substring(0, 1).toLocaleLowerCase() + name.substring(1)
}

export const constructors = (d: M.Data): AST<Array<ts.Node>> => {
  return new Reader(e => {
    return d.constructors.toArray().map(c => {
      const name = getConstructorName(c.name)
      if (c.members.length === 0) {
        return ts.createVariableStatement(
          [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
          ts.createVariableDeclarationList(
            [
              ts.createVariableDeclaration(
                name,
                ts.createTypeReferenceNode(
                  d.introduction.name,
                  d.introduction.parameters.map(p =>
                    p.constraint
                      .map<ts.TypeNode>(c => getType(c))
                      .getOrElse(ts.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword))
                  )
                ),
                ts.createObjectLiteral([ts.createPropertyAssignment(e.tag, ts.createStringLiteral(c.name))])
              )
            ],
            ts.NodeFlags.Const
          )
        )
      } else {
        return ts.createFunctionDeclaration(
          undefined,
          [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
          undefined,
          name,
          d.introduction.parameters.map(p => {
            return ts.createTypeParameterDeclaration(p.name, p.constraint.map(getType).toUndefined())
          }),
          c.members.map((m, position) => {
            return ts.createParameter(
              undefined,
              undefined,
              undefined,
              getMemberName(m, position),
              undefined,
              getType(m.type),
              undefined
            )
          }),
          ts.createTypeReferenceNode(
            d.introduction.name,
            d.introduction.parameters.map(p => ts.createTypeReferenceNode(p.name, []))
          ),
          ts.createBlock([
            ts.createReturn(
              ts.createObjectLiteral([
                ts.createPropertyAssignment(e.tag, ts.createStringLiteral(c.name)),
                ...c.members.map((m, position) => {
                  const name = getMemberName(m, position)
                  return ts.createShorthandPropertyAssignment(name)
                })
              ])
            )
          ])
        )
      }
    })
  })
}

const isNullaryConstructor = (c: M.Constructor): boolean => {
  return c.members.length === 0
}

const admitsEagerFold = (d: M.Data): boolean => {
  return d.constructors.toArray().some(isNullaryConstructor)
}

const isSumType = (d: M.Data): boolean => {
  return d.constructors.length() > 1
}

const getFoldReturnTypeParameterName = (i: M.Introduction): string => {
  const base = 'R'
  let candidate = base
  let counter = 0
  while (i.parameters.findIndex(({ name }) => candidate === name) !== -1) {
    candidate = base + ++counter
  }
  return candidate
}

const getHandlerName = (c: M.Constructor): string => {
  return `on${c.name}`
}

const getFold = (d: M.Data, name: string, isEager: boolean): AST<ts.FunctionDeclaration> => {
  return new Reader(e => {
    const returnTypeParameterName = getFoldReturnTypeParameterName(d.introduction)
    return ts.createFunctionDeclaration(
      undefined,
      [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
      undefined,
      name,
      d.introduction.parameters
        .concat(M.parameter(returnTypeParameterName, none))
        .map(p => ts.createTypeParameterDeclaration(p.name, p.constraint.map(getType).toUndefined())),
      [
        ts.createParameter(
          undefined,
          undefined,
          undefined,
          'fa',
          undefined,
          ts.createTypeReferenceNode(
            d.introduction.name,
            d.introduction.parameters.map(p => ts.createTypeReferenceNode(p.name, []))
          ),
          undefined
        ),
        ...d.constructors.toArray().map(c => {
          return ts.createParameter(
            undefined,
            undefined,
            undefined,
            getHandlerName(c),
            undefined,
            isEager && isNullaryConstructor(c)
              ? ts.createTypeReferenceNode(returnTypeParameterName, [])
              : ts.createFunctionTypeNode(
                  undefined,
                  c.members.map((m, position) => {
                    return ts.createParameter(
                      undefined,
                      undefined,
                      undefined,
                      getMemberName(m, position),
                      undefined,
                      getType(m.type)
                    )
                  }),
                  ts.createTypeReferenceNode(returnTypeParameterName, [])
                ),
            undefined
          )
        })
      ],
      ts.createTypeReferenceNode(returnTypeParameterName, []),
      ts.createBlock([
        ts.createSwitch(
          ts.createPropertyAccess(ts.createIdentifier('fa'), e.tag),
          ts.createCaseBlock(
            d.constructors.toArray().map(c => {
              return ts.createCaseClause(ts.createStringLiteral(c.name), [
                ts.createReturn(
                  isEager && isNullaryConstructor(c)
                    ? ts.createIdentifier(getHandlerName(c))
                    : ts.createCall(
                        ts.createIdentifier(getHandlerName(c)),
                        [],
                        c.members.map((m, position) => {
                          return ts.createPropertyAccess(ts.createIdentifier('fa'), getMemberName(m, position))
                        })
                      )
                )
              ])
            })
          )
        )
      ])
    )
  })
}

export const fold = (d: M.Data): AST<Array<ts.FunctionDeclaration>> => {
  let folds: Array<AST<ts.FunctionDeclaration>> = empty
  if (isSumType(d)) {
    if (admitsEagerFold(d)) {
      folds = [getFold(d, 'fold', true), getFold(d, 'foldL', false)]
    } else {
      folds = [getFold(d, 'fold', false)]
    }
  }
  return array.sequence(reader)(folds)
}
