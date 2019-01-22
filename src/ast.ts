import * as ts from 'typescript'
import * as M from './model'

const getMemberName = (m: M.Member, position: number): string => {
  switch (m._tag) {
    case 'NamedMember':
      return m.name
    case 'PositionalMember':
      return `value${position}`
  }
}

const getType = (t: M.Type): ts.TypeReferenceNode => {
  return ts.createTypeReferenceNode(t.name, t.parameters.map(p => getType(p)))
}

export const data = (d: M.Data): ts.TypeAliasDeclaration => {
  const type = ts.createUnionTypeNode(
    d.constructors.toArray().map(c => {
      const tag: ts.TypeElement = ts.createPropertySignature(
        [ts.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
        'type',
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
    d.introduction.parameters.map(p => ts.createTypeParameterDeclaration(p)),
    type
  )
}

const getConstructorName = (name: string): string => {
  return name.substring(0, 1).toLocaleLowerCase() + name.substring(1)
}

export const constructors = (d: M.Data): Array<ts.Node> => {
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
                d.introduction.parameters.map(_ => ts.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword))
              ),
              ts.createObjectLiteral([ts.createPropertyAssignment('type', ts.createStringLiteral(c.name))])
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
          return ts.createTypeParameterDeclaration(p)
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
          d.introduction.parameters.map(p => ts.createTypeReferenceNode(p, []))
        ),
        ts.createBlock([
          ts.createReturn(
            ts.createObjectLiteral([
              ts.createPropertyAssignment('type', ts.createStringLiteral(c.name)),
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
  while (i.parameters.indexOf(candidate) !== -1) {
    candidate = base + ++counter
  }
  return candidate
}

const getHandlerName = (c: M.Constructor): string => {
  return `on${c.name}`
}

const getFold = (d: M.Data, name: string, isEager: boolean) => {
  const returnTypeParameterName = getFoldReturnTypeParameterName(d.introduction)
  return ts.createFunctionDeclaration(
    undefined,
    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
    undefined,
    name,
    d.introduction.parameters.concat(returnTypeParameterName).map(p => ts.createTypeParameterDeclaration(p)),
    [
      ts.createParameter(
        undefined,
        undefined,
        undefined,
        'fa',
        undefined,
        ts.createTypeReferenceNode(
          d.introduction.name,
          d.introduction.parameters.map(p => ts.createTypeReferenceNode(p, []))
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
        ts.createPropertyAccess(ts.createIdentifier('fa'), 'type'),
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
}

export const fold = (d: M.Data) => {
  if (!isSumType(d)) {
    return []
  }
  if (admitsEagerFold(d)) {
    return [getFold(d, 'fold', true), getFold(d, 'foldL', false)]
  }
  return [getFold(d, 'fold', false)]
}
