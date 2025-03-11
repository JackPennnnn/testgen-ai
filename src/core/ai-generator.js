const { OpenAI } = require('openai');

class AIGenerator {
    constructor(config,source) {
        this.openai = new OpenAI( {
            apiKey: config.apiKey,
            baseURL: config.baseURL
        });
        this.model = config.model
        this.basePrompt = `
      作为专业测试工程师，请为以下{{functionName}}方法生成完善的单元测试,我的方法来自于${source}。
      要求：
      ✅ 使用{{framework}}框架
      ✅ 包含正常/边界/异常用例
      ✅ 保持与现有测试的兼容性
      ✅ 文字解释格式请保持js注释格式
      ✅ 请生成ESM语法
    `;
    }

    async generateForFunction(sourceCode, context) {
        const prompt = this.buildPrompt(sourceCode, context);
        const response = await this.openai.chat.completions.create({
            model: this.model,
            messages: [{
                role: "system",
                content: "你是一个专注于生成高质量测试代码的助手"
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.postProcess(response.choices[0].message.content);
    }

    buildPrompt(code, { functionName, existingTests }) {
        return this.basePrompt
                .replace('{{framework}}', 'jest')
                .replace('{{functionName}}', functionName.name)
                .replace('{{existingTests}}', existingTests.map(item => item.name).join(', ')) +
            `\n\n源码：\n${code}`;
    }

    postProcess(code) {

        return (code.match(/```javascript([\s\S]*?)```/g) || [])
            .map(block => {
                return block
                    // 去除代码块标记
                    .replace(/^```javascript|```$/g, '')
                    // 清理空行
                    .replace(/(^\s*$\n)/gm, '')
                    .trim();
            })
            .filter(code => code.length > 0).join(','); // 过滤空内容
    }
}

module.exports = AIGenerator;