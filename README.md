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
