import { execSync } from 'node:child_process';
import * as path from 'node:path';

export function getChangedFiles(projectPath: string): string[] {
    try {
        const diffFiles = execSync('git diff --name-only HEAD', {
            cwd: projectPath,
            encoding: 'utf-8'
        });

        const untrackedFiles = execSync('git ls-files --others --exclude-standard', {
            cwd: projectPath,
            encoding: 'utf-8'
        });

        const changed = new Set([
            ...diffFiles.split('\n'),
            ...untrackedFiles.split('\n')
        ].map(f => f.trim()).filter(Boolean));

        return Array.from(changed).map(f => path.join(projectPath, f));
    } catch (error) {
        console.warn('  ⚠️ 获取 Git 增量变更失败（非 Git 仓库或暂未提交过合并），将降级为全量测试: ', error instanceof Error ? error.message : String(error));
        // 返回特殊标识 null 或空数组让外部知晓，这里选择用空代表无变更或异常
        return [];
    }
}
