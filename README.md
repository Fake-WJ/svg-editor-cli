# SVG Editor CLI — Lab1 Phase 1

TypeScript 面向对象 SVG 编辑器。支持六种内置图形、嵌套容器、SVG 读写以及命令级撤销/重做。

## 运行

需要 Node.js 22 或以上版本。

```sh
npm ci
npm run cli
```

```text
init 800 600
create g scene
create rect r1 20 30 120 60 red in scene
create text t1 40 65 "Hello SVG" in scene
move scene 10 20
undo
tree
save demo.svg
```

把 `demo.svg` 拖入浏览器即可预览。输入结束（Ctrl+D；Windows 终端也可用 Ctrl+Z 后回车）退出。支持标准输入脚本回放。

```sh
npm run check
npm run cli -- --script examples/flowchart.txt
```

架构、设计决策、开发记录、验收范围见 [doc/README.md](doc/README.md)。

## 范围与验证

支持全部 Phase 1 命令与六种类型：rect / circle / ellipse / line / text / g。`box` 留待后续插件阶段。

采用 Command + Composite + 文档快照事务。命令失败不提交状态；文档 IO 成功后锁定撤销，下一次成功编辑解锁。脚本含错误时继续处理后续行，最终退出码为 1；错误写入 stderr。

`npm run check` 包含严格类型检查、21 项自动测试以及架构依赖检查。GitHub Actions 覆盖 Windows/Ubuntu、Node 22/24。

SVG 仅支持作业范围内的元素与属性；复杂外部 SVG 的支持边界详见架构文档。示例输出：[flowchart.svg](examples/flowchart.svg)。
