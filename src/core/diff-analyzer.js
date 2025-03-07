// src/core/diff-analyzer.js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const crypto = require('crypto');

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

    /**
     * 对比新旧代码差异
     * @param {string} newCode 新代码
     * @param {string} oldCode 旧代码
     * @returns {{
     *   added: Array<FunctionInfo>,
     *   modified: Array<FunctionInfo>,
     *   removed: Array<FunctionInfo>
     * }}
     */
    diff(newCode, oldCode) {
        const newFuncs = this.parseFunctions(newCode);
        const oldFuncs = this.parseFunctions(oldCode || '');

        const newMap = new Map(newFuncs.map(f => [f.name, f]));
        const oldMap = new Map(oldFuncs.map(f => [f.name, f]));

        // 检测新增函数
        const added = newFuncs.filter(f => !oldMap.has(f.name));

        // 检测移除函数
        const removed = oldFuncs.filter(f => !newMap.has(f.name));

        // 检测修改函数
        const modified = newFuncs.filter(f => {
            const oldFunc = oldMap.get(f.name);
            return oldFunc && this._isFunctionModified(f, oldFunc, newCode, oldCode);
        });

        return { added, modified, removed };
    }

    /**
     * 生成代码内容哈希
     * @param {string} code
     * @returns {string}
     */
    createContentHash(code) {
        return crypto.createHash('sha256')
            .update(code)
            .digest('hex');
    }

    // 私有方法：去重函数列表
    _uniqueFunctions(functions) {
        const seen = new Set();
        return functions.filter(f => {
            const key = `${f.name}-${f.type}-${f.line}`;
            return seen.has(key) ? false : seen.add(key);
        });
    }

    // 私有方法：判断函数是否修改
    _isFunctionModified(newFunc, oldFunc, newCode, oldCode) {
        // 通过哈希对比函数体内容
        const newBodyHash = this._getFunctionBodyHash(newFunc, newCode);
        const oldBodyHash = this._getFunctionBodyHash(oldFunc, oldCode);
        return newBodyHash !== oldBodyHash;
    }

    // 私有方法：获取函数体哈希
    _getFunctionBodyHash(func, code) {
        const lines = code.split('\n');
        const bodyLines = lines.slice(func.line - 1); // 简化实现
        return crypto.createHash('sha256')
            .update(bodyLines.join('\n'))
            .digest('hex');
    }
}

module.exports = DiffAnalyzer;