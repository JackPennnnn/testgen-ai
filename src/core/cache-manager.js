const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 缓存管理器
 */
class CacheManager {
    constructor() {
        this.cacheDir = path.join(process.cwd(), '.testgen_cache');
        this.ensureCacheDir();
    }

    /**
     * 判断缓存目录在不在，不在就创建
     */
    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    /**
     * 获取缓存文件路径
     * @param sourcePath 路径
     * @returns {string}
     */
    getFileCachePath(sourcePath) {
        const hash = crypto.createHash('sha256')
            .update(sourcePath)
            .digest('hex');
        return path.join(this.cacheDir, `${hash}.json`);
    }

    /**
     * 读取缓存
     * @param sourcePath 路径
     * @returns {any|{functions: *[], hash: string}}
     */
    readCache(sourcePath) {
        const cacheFile = this.getFileCachePath(sourcePath);
        return fs.existsSync(cacheFile)
            ? JSON.parse(fs.readFileSync(cacheFile))
            : { functions: [], hash: '' };
    }

    /**
     * 更新缓存
     * @param sourcePath 路径
     * @param content
     * @param functions
     */
    updateCache(sourcePath, content, functions) {
        const cache = {
            hash: this.createContentHash(content),
            functions: functions,
            timestamp: Date.now()
        };
        fs.writeFileSync(
            this.getFileCachePath(sourcePath),
            JSON.stringify(cache)
        );
    }

    /**
     * 创建内容哈希
     * @param content
     * @returns {string}
     */
    createContentHash(content) {
        return crypto.createHash('sha256')
            .update(content)
            .digest('hex');
    }
}

module.exports = CacheManager;