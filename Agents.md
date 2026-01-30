# Happy Coder Project Configuration (TypeScript / Expo / React Native)

> **Version**: 1.0.0 | **Updated**: 2026-01-30 | **For**: AI Coding Agents (Claude Code, Codex, etc.)

## 项目概述
Happy Coder 是一个开源项目，提供 Claude Code 和 Codex 的移动端和 Web 客户端。支持端到端加密，让用户可以从任何地方控制 AI 编程助手。

### 项目结构
```
happy/
├── cli/           # 命令行工具 (Node.js/TypeScript)
├── expo-app/      # 移动和 Web 客户端 (Expo/React Native)
└── server/        # 后端服务器 (Node.js/TypeScript)
```

### 模块职责
- **cli**: 包装 `claude` 和 `codex` 命令，提供远程控制能力
- **expo-app**: iOS/Android/Web 客户端，支持实时会话控制和推送通知
- **server**: 加密同步服务，处理设备间通信

---

## 0. COMMANDS (Executable Quick List)
> 以下命令仅记录，不自动执行；执行前需确认权限与路径。构建类命令需用户授权。

### 依赖安装（各模块独立）
```bash
# 根目录（无 workspace，各模块独立管理）
cd cli && yarn install
cd expo-app && yarn install
cd server && yarn install
```

### 开发模式
```bash
# CLI 开发
cd cli && yarn dev

# Expo App 开发
cd expo-app && yarn start    # Expo Dev Server
cd expo-app && yarn ios      # iOS 模拟器
cd expo-app && yarn android  # Android 模拟器
cd expo-app && yarn web      # Web 浏览器

# Server 开发
cd server && yarn dev
```

### 构建命令
```bash
# CLI 构建
cd cli && yarn build

# Expo App 构建（需 EAS）
cd expo-app && eas build --platform ios
cd expo-app && eas build --platform android

# Server 构建
cd server && yarn build
```

### 测试命令
```bash
# CLI 测试
cd cli && yarn test

# Expo App 测试
cd expo-app && yarn test

# Server 测试
cd server && yarn test
```

### 代码检查
```bash
# TypeScript 类型检查
cd cli && yarn tsc --noEmit
cd expo-app && yarn tsc --noEmit
cd server && yarn tsc --noEmit

# ESLint 检查（如配置）
yarn eslint . --ext .ts,.tsx
```

### 搜索（通用）
```bash
# 文本搜索
rg -n "pattern" .

# TypeScript 文件搜索
rg -n "pattern" --type ts

# 特定模块搜索
rg -n "pattern" cli/src
rg -n "pattern" expo-app/sources
rg -n "pattern" server/sources
```

---

## 1. CORE WORKFLOW PROTOCOL (The 3-Step Cycle)

**Stage-Gated**: 只有收到 `/spec` `/plan` `/do` 明确指令才进入对应阶段；需求变更→回退上一阶段确认。

### Phase 1: /spec (Specification & Context)
- **Goal**: Understand requirement, map codebase.
- **Permissions**: READ-ONLY.
- **Mandatory Actions**:
  1. Search (rg) 定位相关代码。
  2. 依赖检查（package.json）。
  3. 总结需求。
  4. 识别涉及的模块（cli/expo-app/server）。

### Phase 2: /plan (Architecture & Strategy)
- **Goal**: Design solution.
- **Permissions**: READ-ONLY.
- **Mandatory Actions**:
  1. 文件列表（精确到行号范围）。
  2. 伪代码或代码片段。
  3. 影响分析（跨模块影响）。
  4. 等待用户批准。
  5. 产物：`docs/plans/YYYY-MM-DD-<title>.md`。

### Phase 3: /do (Implementation)
- **Goal**: Apply changes.
- **Permissions**: WRITE ALLOWED (代码文件), **可执行验证命令** (测试/lint).
- **Mandatory Actions**:
  1. 增量编辑。
  2. 同步更新 plan.md：勾选完成项，记录阻塞/偏差。
  3. 自检：运行测试和类型检查。

### $autonomous-skill 模式
当 `$autonomous-skill` 技能激活时，`$spec-plan-do` 失效，**Stage-Gated** 无需用户确认，AI 内部静默遵循 spec→plan→do 三阶段方法论。

---

## 1.1 IRON LAWS (铁律) - 完整版

以下铁律在任何阶段均**强制执行，不可违反**。

---

### 铁律 1: TDD (Test-Driven Development)

> **状态：默认关闭** — TDD 仅在以下情况启用：
> 1. 用户在 /do 前明确授权启用；或
> 2. Agent 在 /spec 或 /plan 阶段判断任务需要 TDD，并在 /do 前询问用户获准。

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
无失败测试，不写生产代码
```

**流程**: RED → GREEN → REFACTOR
- 先写测试 → 看它失败 → 写最小实现 → 看它通过 → 重构

**TDD 在本项目的适配（仅在 TDD 启用时生效）**:
- 使用 Vitest 框架（所有模块）
- 测试文件命名：`*.test.ts` 或 `*.spec.ts`
- 测试位置：与源文件同目录或 `__tests__/` 目录

---

### 铁律 2: 系统调试 (Systematic Debugging)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
无根因分析，不提修复方案
```

**四阶段流程**:
1. **根因调查**: 读错误信息 → 稳定复现 → 查最近变更 → 收集证据
2. **模式分析**: 找正常工作的类似代码 → 对比差异
3. **假设测试**: 形成假设 → 最小改动测试 → 验证
4. **实现修复**: 创建失败测试 → 单一修复 → 验证

**3次重试铁律**:
```
同一问题失败 3 次 → 停止代码修复 → 讨论架构问题
```

---

### 铁律 3: 完成验证 (Verification Before Completion)

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
无验证证据，不宣称完成
```

**验证门函数**:
1. IDENTIFY: 什么命令能证明声明？
2. RUN: 执行验证命令（测试/lint/类型检查）
3. READ: 完整阅读输出，检查退出码
4. VERIFY: 输出是否确认声明？
5. ONLY THEN: 做出声明

**常见声明验证**:
| 声明 | 必须有的证据 | 验证命令 |
|------|-------------|----------|
| "测试通过" | 测试命令输出：0 failures | `yarn test` |
| "类型正确" | tsc 无错误 | `yarn tsc --noEmit` |
| "bug 修好了" | 原症状测试通过 | `yarn test <specific-test>` |

**禁止模糊宣称**:
| 禁止词汇 | 应替换为 |
|----------|----------|
| "可能是..." | "假设（待验证）：..." |
| "应该是..." | 先验证，再陈述事实 |
| "大概..." | 明确标注不确定，并索要证据 |

---

### 铁律快速参考卡

```
┌─────────────────────────────────────────────────────────────────┐
│ TDD（启用时）: 无失败测试 → 不写代码（默认关闭，需用户授权启用）   │
│ DEBUG:  无根因分析 → 不提修复；失败3次→停止讨论架构               │
│ VERIFY: 无验证证据 → 不宣称完成（Agent 自主运行验证命令）          │
│ EXEC:   测试/lint 可执行；构建需授权；部署禁止                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CRITICAL SYSTEM INSTRUCTIONS

### Safety & Permissions
- **DESTRUCTIVE COMMANDS**: ASK permission for git reset, clean, rm -rf.
- **Protected Files**: 不要修改 `*.lock` 文件（yarn.lock）。
- **Dependencies**: 禁止自动安装/升级依赖；如需新增包由用户手动执行或显式授权。
- **环境变量**: 不要将 API 密钥或敏感信息硬编码到代码中。

### 命令执行权限
- ✅ **允许执行（验证类，只读）**:
  - 测试命令：`yarn test`, `vitest`
  - Lint/Format 检查：`eslint`, `prettier --check`
  - 类型检查：`tsc --noEmit`
- ⚠️ **需用户授权执行（构建类）**:
  - 构建命令：`yarn build`, `eas build`
- ❌ **禁止执行**:
  - 部署/发布：`npm publish`, `eas submit`, `docker push`
  - 破坏性 git：`git push --force`, `git reset --hard`
  - 依赖变更：`yarn add`, `yarn remove`（除非用户显式授权）

### Shell Protocol
- **主开发环境**: Windows (PowerShell 或 cmd)
- **路径格式**: 使用 Windows 风格路径 (`d:\Code\git\happy`)
- **Node.js**: 使用 `node` 或 `npx` 执行脚本
- **终端编码**: 确保终端使用 UTF-8 (`chcp 65001`)

### Git 提交规范（自动提交）
Agent 完成任务后**必须自动提交到 Git**，遵循以下规范：

**提交流程**:
1. 完成功能/修复后，检查所有修改的文件
2. 执行 `git add <相关文件>`
3. 执行 `git commit -m "<type>: <description>"`
4. 提交后向用户报告

**Commit Message 格式**:
```
<type>: <简短描述>

[可选：详细说明]
```

**Type 类型**:
| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `refactor` | 重构（无功能变化） |
| `test` | 测试相关 |
| `chore` | 构建/配置变更 |

**示例**:
```bash
git add cli/src/api/encryption.ts
git commit -m "feat: 添加端到端加密消息验证"
```

**禁止事项**:
- ❌ 不提交就结束任务
- ❌ 模糊的 commit message（如 "update", "fix bug"）
- ❌ 一次提交包含不相关的多个功能

---

## 3. ENCODING & FILE HANDLING

### 编码规范
- **统一 UTF-8**: 本项目所有文件均使用 UTF-8 编码，无 BOM。
- **无需编码检测**: 不存在 GBK/GB18030 等编码问题。

### 文件操作效率规范

> **原则**: 搜索→读取→编辑 三阶段，每阶段尽量一次完成

#### 1. 搜索阶段
| 场景 | 推荐命令 |
|------|----------|
| 文本内容搜索 | `rg -n <pattern>` |
| TypeScript 文件 | `rg -n <pattern> --type ts` |
| 排除 node_modules | `rg -n <pattern> --glob '!node_modules'` |

#### 2. 编辑阶段
| 文件行数 | 推荐工具 |
|----------|----------|
| ≤300行 | `edit_file` 全文替换 |
| >300行 | `replace_in_file` 精确 SEARCH/REPLACE |

---

## 4. CODING STANDARD: TypeScript / React Native

### 4.1 核心原则
1. **类型安全**: 尽量使用严格类型，避免 `any`。
2. **函数式优先**: 优先使用函数组件和 hooks。
3. **模块化**: 按功能分组，保持高内聚。

### 4.2 命名约定
| 类型 | 约定 | 示例 |
|------|------|------|
| 文件名（组件） | PascalCase | `MessageFormatter.tsx` |
| 文件名（工具） | camelCase | `deriveKey.ts` |
| 函数/变量 | camelCase | `createSessionMetadata` |
| 类型/接口 | PascalCase | `SessionMetadata` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_TIMEOUT` |

### 4.3 文件组织
```
module/
├── index.ts          # 导出入口
├── types.ts          # 类型定义
├── utils.ts          # 工具函数
├── Component.tsx     # React 组件
└── Component.test.ts # 测试文件
```

### 4.4 React Native / Expo 最佳实践
- 使用 `expo-` 前缀的官方包优先。
- 平台特定代码使用 `.ios.ts` / `.android.ts` 后缀。
- 样式使用 NativeWind (TailwindCSS) 或 StyleSheet。

### 4.5 复杂度控制
- 函数不超过 50 行。
- 组件不超过 200 行。
- 单文件不超过 500 行（超过考虑拆分）。

---

## 5. AGENT ROLE

### 5.1 任务格式
- 接收: 背景、需求、文件列表、约束条件。

### 5.2 反馈格式
- 返回: 修改的文件、关键变更、验证状态。

### 5.3 禁止事项
- NO 自动发布/部署。
- NO 未经批准删除文件。
- NO 修改环境配置文件（.env*）中的敏感信息。

---

## 6. 项目特有规则

### 6.1 端到端加密注意事项
- 加密相关代码在 `cli/src/api/encryption.ts` 和 `expo-app/sources/encryption/`
- 修改加密逻辑需要特别谨慎，确保前后端兼容性
- 密钥派生使用 `deriveKey.ts`，不要硬编码任何密钥

### 6.2 三模块协作规范
| 模块 | 职责 | 关键路径 |
|------|------|----------|
| cli | 命令行入口、本地代理 | `cli/src/` |
| expo-app | 用户界面、移动交互 | `expo-app/sources/` |
| server | 消息中转、状态同步 | `server/sources/` |

### 6.3 跨模块修改检查清单
修改涉及多个模块时，检查：
- [ ] API 契约是否一致（类型定义）
- [ ] 加密/解密逻辑是否匹配
- [ ] 版本兼容性考虑

### 6.4 Monorepo 开发流程
1. 各模块独立 `package.json`，无 workspace。
2. 修改后在对应模块目录运行测试。
3. 跨模块功能需要分别测试各模块。

---

## 7. 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| CLI 文档 | `cli/README.md` | CLI 工具使用说明 |
| Expo App 文档 | `expo-app/README.md` | 移动应用开发说明 |
| Server 文档 | `server/README.md` | 服务器部署说明 |
| 开发计划 | `docs/plans/` | 开发计划文档目录 |
| 会话上下文 | `context/sessions/` | AI 会话上下文 |
