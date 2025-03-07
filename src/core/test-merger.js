const recast = require('recast');
const types = recast.types;
const builders = types.builders;
const { namedTypes: t } = types;

class TestMerger {
    merge(newTestCode, existingCode) {
        try {
            const newAst = this.parseWithComments(newTestCode);
            const existingAst = this.parseWithComments(existingCode);

            return this.generateMergedCode(
                this.mergeImports(existingAst, newAst),
                this.mergeDescribes(existingAst, newAst)
            );
        } catch (error) {
            throw new Error(`合并失败: ${error.message}`);
        }
    }

    // 带注释解析的封装方法
    parseWithComments(code) {
        return recast.parse(code, {
            parser: require('recast/parsers/babel'),
            tokens: true,
            range: true,
            comment: true
        });
    }

    // 智能合并import语句
    mergeImports(...asts) {
        const importsMap = new Map();

        asts.forEach(ast => {
            this.getImports(ast).forEach(importNode => {
                const key = importNode.source.value;
                if (!importsMap.has(key)) {
                    importsMap.set(key, new Set());
                }

                const existing = importsMap.get(key);
                importNode.specifiers.forEach(spec => {
                    const specStr = t.ImportDeclaration.toString(spec);
                    if (![...existing].some(e => e === specStr)) {
                        existing.add(spec);
                    }
                });
            });
        });

        return [...importsMap].map(([source, specs]) =>
            builders.importDeclaration(
                [...specs],
                builders.stringLiteral(source)
            )
        );
    }

    // 深度合并describe块
    mergeDescribes(...asts) {
        const describeMap = new Map();

        asts.forEach(ast => {
            this.getDescribes(ast).forEach(describeNode => {
                const describeName = this.getDescribeName(describeNode);
                const tests = this.getTests(describeNode);

                if (describeMap.has(describeName)) {
                    // 合并已有describe的测试用例
                    const existing = describeMap.get(describeName);
                    describeMap.set(describeName, {
                        node: this.mergeTestCases(existing.node, tests),
                        comments: [...existing.comments, ...this.getComments(describeNode)]
                    });
                } else {
                    // 新增describe块
                    describeMap.set(describeName, {
                        node: builders.expressionStatement(
                            builders.callExpression(
                                builders.identifier('describe'),
                                [
                                    builders.stringLiteral(describeName),
                                    builders.arrowFunctionExpression(
                                        [],
                                        builders.blockStatement(tests))
                                ]
                            )
                        ),
                        comments: this.getComments(describeNode)
                    });
                }
            });
        });

        return [...describeMap.values()];
    }

    // 辅助方法：合并测试用例并去重
    mergeTestCases(existingTests, newTests) {
        const existingNames = new Set(
            existingTests.map(t => t.expression?.arguments?.[0]?.value)
        );

        return [
            ...existingTests,
            ...newTests.filter(t => !existingNames.has(t.expression?.arguments?.[0]?.value))
        ];
    }

    // 生成最终代码（保留格式）
    generateMergedCode(imports, describes) {
        const program = builders.program([
            ...imports,
            ...describes.flatMap(d => [
                ...d.comments,
                d.node
            ])
        ]);

        return recast.print(program, {
            quote: 'single',
            tabWidth: 2,
            trailingComma: true,
            wrapColumn: 80
        }).code;
    }

    // 以下为工具方法
    getImports(ast) {
        return ast.program.body.filter(
            node => t.ImportDeclaration.check(node)
        );
    }

    getDescribes(ast) {
        return ast.program.body.filter(node =>
            t.ExpressionStatement.check(node) &&
            t.CallExpression.check(node.expression) &&
            node.expression.callee.name === 'describe'
        );
    }

    getDescribeName(node) {
        return node.expression.arguments[0].value;
    }

    getTests(describeNode) {
        return describeNode.expression.arguments[1].body.body;
    }

    getComments(node) {
        return node.comments || [];
    }
}

module.exports = TestMerger;