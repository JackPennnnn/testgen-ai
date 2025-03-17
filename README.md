# TestGen AI 🤖

一款基于 Node.js 的智能单元测试生成工具，支持通过自然语言交互快速生成完善的测试用例。

---

## 功能特性 ✨

- 🚀 **AI 智能生成**：通过 OpenAI 模型自动生成测试代码
- 🔄 **增量更新**：仅生成新增方法的测试用例
- 📁 **配置管理**：支持本地配置文件和环境变量
- ✅ **多框架支持**：支持 Jest/Mocha 测试框架
- 💬 **交互模式**：提供友好的命令行交互界面

---

## 功能演示 🖥️

### 选择需要生成的JS或TS文件，例子：

```tsx
// math.ts
export function getSizeImage(imgUrl: string, size: number):string {
    return `${imgUrl}?param=${size}x${size}`;
}

export function getCount(count: number):number | string {
    if (count < 0) return;
    if (count < 10000) {
        return count;
    } else if (Math.floor(count / 10000) < 10000) {
        return Math.floor(count / 1000) / 10 + "万";
    } else {
        return Math.floor(count / 10000000) / 10 + "亿";
    }
}
```

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image.png?raw=true)

### 选择需要生成的方法

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%201.png?raw=true)

### 等待AI生成

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%202.png?raw=true)

### 生成成功

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%203.png?raw=true)

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%204.png?raw=true)

### 第二次生成，生成过的方法不会再出现

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%205.png?raw=true)

### 第二次生成，代码会自动合并

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%206.png?raw=true)

---

## 安装使用指南 📦

### 前置要求

- Node.js v18+
- npm 6+
- 申请AI模型API-Key

### 安装方式

```bash
# 全局安装
npm install testgen-ai
```

### 使用方式

1. 初始化，生成 **testgen.config.json**

    ```jsx
    npx testgen init
    ```

2. 配置环境变量
    1. 访问https://bailian.console.aliyun.com/?spm=5176.29597918.J_SEsSjsNv72yRuRFS2VknO.2.53ef7ca0HZZ8we#/model-market
    2. 选取其中一个模型，打开 **API调用示例** 复制baseURL、apiKey、model到 **testgen.config.json**中

   ![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%207.png?raw=true)

   ![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/image%208.png?raw=true)

3. 运行项目，根据命令操作

    ```jsx
    npx testgen
    ```


## 配置文件参数说明 📄

```tsx
{
  "openai": {
    "apiKey": "",// api key
    "baseURL": "", // 请求url
    "model": "" // 模型
  },
  "config": {
    "cache": true, // 为true 代表缓存这次生成用例的方法，下次会略过
    "unit": "jest" // 单元测试框架
  }
}
```

## 程序流程图

![image.png](https://github.com/JackPennnnn/testgen-ai/blob/master/documents/e3c568df-f80c-4c3f-9808-be5ad731b4a2.png?raw=true)