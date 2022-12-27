<h1 align="center">@homeiot/xiaomi-cli</h1>

<p align="center">
  <a href="https://github.com/qq15725/homeiot/blob/master/LICENSE" class="mr-3">
    <img src="https://img.shields.io/npm/l/homeiot.svg" alt="License">
  </a>
  <a href="https://www.npmjs.com/package/@homeiot/xiaomi-cli">
    <img src="https://img.shields.io/npm/v/@homeiot/xiaomi-cli.svg" alt="Version">
  </a>
  <a href="https://cdn.jsdelivr.net/npm/@homeiot/xiaomi-cli/dist/index.mjs">
    <img src="https://img.shields.io/bundlephobia/minzip/@homeiot/xiaomi-cli" alt="Minzip">
  </a>
</p>

<p align="center"><a href="README.md">English</a> | 简体中文</p>

<p align="center">Node.js 下的小米 MIoT/miIO 局域网/公网控制 CLI</p>

## 📦 安装

```shell
npm install -g @homeiot/xiaomi-cli
```

## 🦄 使用

### 在公网访问下控制

#### 登录小米账号

```shell
miot login
```

> 根据提示输入 Username 和 Password
>
> ⚠️ 账号密码仅本次登录使用，不会存储
>
> ⚠️ 登录后的访问令牌会缓存到 `node_modules/.miot` 下，供后续指令使用

#### 查看公网设备列表

```shell
miot
```

输出：

```shell
    did: 57058****
   name: Mi AI Speaker Play
  model: xiaomi.wifispeaker.l05b
  token: ********************************
   ssid: w2.4
localip: 10.0.0.3
 online: true

    did: 46066****
   name: 空气净化器
  model: zhimi.airpurifier.ma2
  token: ********************************
   ssid: w2.4
localip: 10.0.0.2
   prop: {"aqi":"161","mode":"auto","power":"off"}
 method: [{"allow_values":"on off","name":"set_power"}]
 online: true
```

#### 查看公网设备详情

通过设备 `did` 查询详情

```shell
miot 57058****
```

输出：

```shell
ℹ Device basic information

    did: 57058****
   name: Mi AI Speaker Play
  model: xiaomi.wifispeaker.l05b
  token: ********************************
   ssid: w2.4
localip: 10.0.0.3
 online: true

ℹ Device specification

Speaker
  1 Device Information
    Properties
      1.1 Device Manufacturer, string, read
      1.2 Device Model, string, read
      1.3 Device Serial Number, string, read
      1.4 Current Firmware Version, string, read
  2 Speaker
    Properties
      2.1 Volume, uint8, read write notify
      2.2 Mute, bool, read write notify
  3 Play Control
    Properties
      3.1 Playing State, uint8, read notify
      3.2 Seek Time, int16, _
      3.3 Play Loop Mode, uint8, read write notify
    Actions
      3.1 Seek, 2, _
      3.2 Play, _, _
      3.3 Pause, _, _
      3.4 Stop, _, _
      3.5 Previous, _, _
      3.6 Next, _, _
  4 Microphone
    Properties
      4.1 Mute, bool, read write notify
  5 Intelligent Speaker
    Properties
      5.1 Text Content, string, _
      5.2 Silent Execution, bool, _
    Actions
      5.1 Wake Up, _, _
      5.2 Play Radio, _, _
      5.3 Play Text, 1, _
      5.4 Execute Text Directive, 1 2, _
      5.5 Play Music, _, _
  6 Clock
    Properties
      6.1 Switch Status, bool, read write notify
      6.2 Status, uint8, read notify
      6.3 Device Fault, uint8, read notify
      6.4 Ringtone, uint8, read write notify
    Actions
      6.1 Stop Alarm, _, _

ℹ Device specification url https://home.miot-spec.com/spec/xiaomi.wifispeaker.l05b
```

#### 控制公网设备

留意详情 `Device specification` 下的 `Properties` 和 `Actions`

通过属性或动作的 `iid` 控制公网设备

##### 查询/修改属性

> 例如 `2.1 Volume, uint8, read write notify` 即为扬声器的音量的定义，此处 `2.1` 即为音量属性的 `iid`

- 查询当前音量
  ```shell
  miot 57058**** 2.1
  ```
- 改变音量到 80%
  ```shell
  miot 57058**** 2.1 80
  ```

##### 触发动作

> 例如 `5.3 Play Text, 1, _` 即为播放文本方法的定义，此处 `5.3` 即为播放文本方法的 `iid`

- 让小爱音响播放指定文本（`-a` 代表执行的是方法）
  ```shell
  miot 57058**** 5.3 "嘿Siri，今天天气如何？" -a
  ```

### 在局域网下控制

> TODO

#### 发现局域网设备

```shell
miot discover
```

## 帮助

```shell
miot --help
```

