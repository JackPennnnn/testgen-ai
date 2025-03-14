#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const {program} = require('commander');
const ora = require('ora');
const inquirer = require('inquirer');
const CacheManager = require('./core/cache-manager');
const DiffAnalyzer = require('./core/diff-analyzer');
const AIGenerator = require('./core/ai-generator');
const TestMerger = require('./core/test-merger');
const template = require('./template/index')

program
    .version('1.0.0')
    .description('AI 智能测试生成工具')
    .option('-i, --init', '初始化项目')
    .parse();

const options = program.opts();
if(options.init){
    if (!fs.existsSync('testgen.config.json')) {
        fs.writeFileSync('testgen.config.json', JSON.stringify(template), 'utf-8')
        console.log(chalk.green('✅ 配置文件创建成功！'));
    } else {
        console.error(chalk.red(`❌ 已存在配置文件，不要重复创建`));
    }
    process.exit(1); // 退出进程，并返回错误码 1
}


if (!fs.existsSync('testgen.config.json')) {
    console.error(chalk.red(`❌ 并没有找到配置文件，请运行npx textgen init`));
    return
}
const config = JSON.parse(fs.readFileSync('testgen.config.json'));

(async () => {
    try {
        const spinner = ora();
        // 获取源代码路径
        const {source} = await inquirer.prompt({
            type: 'input',
            name: 'source',
            message: '📁 请输入源代码文件路径:',
            validate: input => fs.existsSync(input) || '文件不存在'
        });
        const output = '__tests__'
        // const { source, output } = program.opts();
        const sourceCode = fs.readFileSync(source, 'utf-8');
        // 初始化核心模块
        const cacheManager = new CacheManager(config);
        const diffAnalyzer = new DiffAnalyzer();
        const aiGenerator = new AIGenerator(config, source);
        const testMerger = new TestMerger();


        // 获取文件缓存
        const cache = config?.config?.cache ? cacheManager.readCache(source) : { functions: [], hash: '' };
        const currentFunctions = diffAnalyzer.parseFunctions(sourceCode);

        // 判断生成模式
        const isInitial = cache.functions.length === 0;
        const newFunctions = isInitial
            ? currentFunctions
            : currentFunctions.filter(f => !cache.functions.some(cached =>
                cached.name === f.name &&
                cached.type === f.type
            ));

        // 生成测试代码
        const outputPath = path.join(output,
            `${path.basename(source, '.js')}.test.js`);
        let finalCode = ''

        if (newFunctions.length > 0) {
            console.log(chalk.yellow(
                cache.functions.length > 0
                    ? '\n⚠️  检测到已存在的测试文件'
                    : '\n🆕 发现新方法'
            ));
            // 选择生成方法
            const {selected} = await inquirer.prompt({
                type: 'checkbox',
                name: 'selected',
                pageSize: 10,
                message: '🔍 请选择要生成测试的方法:',
                choices: [
                    ...newFunctions.map(f => ({
                        name: `${chalk.cyan(f.name)} ${chalk.gray(`(行号: ${f.line})`)}`,
                        value: f
                    })),
                    new inquirer.Separator(),
                    {
                        name: chalk.green.bold('✅ 全选所有方法'),
                        value: 'ALL'
                    }
                ]
            });
            // 处理全选
            const selectedFunctions = selected.includes('ALL')
                ? newFunctions
                : selected.filter(f => f !== 'ALL');

            // 生成测试代码
            spinner.start('🔄 正在生成测试代码...')
            const allFunctionNames = selectedFunctions.map(f => f.name);
            const generated = await Promise.all(
                [aiGenerator.generateForFunction(sourceCode, {
                    functionName: allFunctionNames,
                    existingTests: cache.functions
                })]
            );
            spinner.succeed('生成完成！');
            // 合并测试代码
            if (fs.existsSync(outputPath)) {
                const existing = fs.readFileSync(outputPath, 'utf-8');
                finalCode = testMerger.merge(testMerger.merge(generated.join('\n\n'),''), existing);
            } else {
                finalCode = generated.join('\n\n');
            }

            // 写入文件
            fs.mkdirSync(path.dirname(outputPath), {recursive: true});
            fs.writeFileSync(outputPath, finalCode);

            // 更新缓存(如果配置为缓存)
            if(config?.config?.cache){
                cacheManager.updateCache(source, sourceCode, [...cache.functions, ...selected]);
            }

            console.log(chalk.green(`✅ 成功生成${selectedFunctions.length}个测试用例，文件名称: ${outputPath}`));
        } else {
            console.log(chalk.blue('\n🎉 未发现新增方法'));
            return;
        }

    } catch (error) {
        console.error(chalk.red(`❌ 生成失败: ${error.message}`));
        process.exit(1);
    }
})();