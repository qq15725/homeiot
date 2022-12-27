<h1 align="center">@homeiot/xiaomi-cli</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/xiaomi-cli">
    <img src="https://img.shields.io/npm/v/@homeiot/xiaomi-cli.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/xiaomi-cli/dist/index.js">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/xiaomi-cli" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">README</a> | 中文文档</p>

<p align="center">Node.js 下的小米 MIoT/miIO 局域网/公网控制 CLI</p>

## 安装

```shell
pnpm add -g @homeiot/xiaomi-cli
```

## 使用

### 帮助

```shell
miot --help
```

### 发现局域网设备

```shell
miot discover
```

### 登录小米账号

```shell
miot login
```

### 查询当前米家公网设备

```shell
miot
```

