# OpenClash 专用覆写模块（mihomo-override）

本文件与 FlClash JS 覆写分开维护，使用 OpenClash 原生 [YAML] 覆写模块格式。

## 文件
- `OpenClash-Override-v1.conf`：远程覆写模块
- `OpenClash-Override-v1.yaml`：纯 YAML 片段（供查看/备份；实际模块使用 .conf 的 [YAML] 区块）

## 兼容与使用说明
1. 本模块需要较新 OpenClash 版本支持 YAML 覆写块（建议 v0.47.081 或更高）。
2. 本模块假设当前订阅已存在名为 `Proxy` 的上级代理策略组。若订阅的主代理组不叫 `Proxy`，需先按实际组名调整模块中引用的 `Proxy`，否则启动校验可能报“proxy not found”。
3. 模块只增加规则集、策略组与分流规则；不重写订阅节点，不修改 DNS、TUN、端口、IPv6 或其他 OpenClash LuCI 设置。
4. 组名均使用 ASCII，规避覆写模块在部分环境中中文/Emoji 编码异常。
5. 规则前置，Muse 域名优先匹配 Muse 组。广告拦截策略组仅 REJECT/DIRECT。
6. 下载 Raw 文件后，在 OpenClash「覆写模块」添加远程模块并绑定到使用中的配置，启用并应用。
7. 如果启用后报错，请检查主组名称（默认 Proxy）与 OpenClash 日志；不要直接重置原配置。

## Raw URL
`https://raw.githubusercontent.com/zhaoxj59/mihomo-override/main/OpenClash-Override-v1.conf`

## 备注
此模块是基于现有订阅的增量覆写，不能替代订阅本身，也不能在未知订阅组名称时保证无需调整即可启动。
