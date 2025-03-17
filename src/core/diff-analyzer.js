// src/core/diff-analyzer.js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class DiffAnalyzer {
    /**
     * 解析代码获取所有函数/方法列表
     * @param {string} code 源代码
     * @returns {Array<{name: string, type: string}> 函数信息数组
     */
    parseFunctions(code) {
        try {
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript', 'classProperties']
            });

            const functions = [];

            traverse(ast, {
                // 处理函数声明
                FunctionDeclaration(path) {
                    if (path.node.id) {
                        functions.push({
                            name: path.node.id.name,
                            type: 'function',
                            line: path.node.loc.start.line
                        });
                    }
                },

                // 处理箭头函数表达式
                VariableDeclarator(path) {
                    if (path.node.init && path.node.init.type === 'ArrowFunctionExpression') {
                        functions.push({
                            name: path.node.id.name,
                            type: 'arrow-function',
                            line: path.node.loc.start.line
                        });
                    }
                },

                // 处理类方法
                ClassMethod(path) {
                    functions.push({
                        name: path.node.key.name,
                        type: 'method',
                        line: path.node.loc.start.line
                    });
                },

                // 处理对象方法
                ObjectMethod(path) {
                    functions.push({
                        name: path.node.key.name,
                        type: 'object-method',
                        line: path.node.loc.start.line
                    });
                }
            });

            return this._uniqueFunctions(functions);
        } catch (error) {
            throw new Error(`代码解析失败: ${error.message}`);
        }
    }

    // 私有方法：去重函数列表
    _uniqueFunctions(functions) {
        const seen = new Set();
        return functions.filter(f => {
            const key = `${f.name}-${f.type}-${f.line}`;
            return seen.has(key) ? false : seen.add(key);
        });
    }
}

module.exports = DiffAnalyzer;