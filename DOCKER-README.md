# 智能药盒系统 - Docker 部署指南

本指南将帮助您使用 Docker Compose 快速部署智能药盒系统，包括 MySQL 数据库、后端服务、前端应用和 MQTT Broker。

## 系统架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │────▶│   Backend   │────▶│   MySQL     │     │  Mosquitto  │
│  (React)    │     │ (Spring Boot)│     │  Database   │◀────│  MQTT Broker│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## 准备工作

1. 安装 Docker 和 Docker Compose
   - Docker: https://docs.docker.com/get-docker/
   - Docker Compose: https://docs.docker.com/compose/install/

2. 克隆或下载项目代码到本地

## 目录结构

```
smart-medicine-box/
├── backend/              # Spring Boot 后端服务
│   ├── src/             # 源代码
│   └── Dockerfile       # 后端 Dockerfile
├── frontend/             # React 前端应用
│   ├── src/             # 源代码
│   ├── Dockerfile       # 前端 Dockerfile
│   └── nginx.conf       # Nginx 配置
├── docker/              # Docker 相关配置
│   ├── mysql/           # MySQL 配置
│   │   └── init.sql     # 数据库初始化脚本
│   └── mosquitto/       # Mosquitto 配置
│       └── mosquitto.conf # MQTT 配置
├── docker-compose.yml   # Docker Compose 配置文件
└── DOCKER-README.md     # 部署指南
```

## 部署步骤

### 1. 构建并启动服务

在项目根目录执行以下命令：

```bash
docker-compose up -d
```

该命令将：
- 构建后端和前端的 Docker 镜像
- 启动 MySQL、Mosquitto、后端和前端服务
- 自动创建数据库和插入初始数据

### 2. 访问系统

- **前端应用**: http://localhost
- **后端 API**: http://localhost:8080/api
- **API 文档**: http://localhost:8080/api/swagger-ui.html (如果已配置)

### 3. 查看服务状态

```bash
docker-compose ps
```

### 4. 查看服务日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs -f backend
```

## 服务详情

### MySQL 数据库

- **容器名称**: smart-medicine-box-mysql
- **端口映射**: 3306:3306
- **用户名**: root
- **密码**: 123456
- **数据库名称**: smart_medicine_box
- **初始数据**: 自动创建6条药品记录

### Mosquitto MQTT Broker

- **容器名称**: smart-medicine-box-mosquitto
- **MQTT 端口**: 1883
- **WebSocket 端口**: 9001
- **配置**: 允许匿名连接，监听所有网络接口

### 后端服务

- **容器名称**: smart-medicine-box-backend
- **端口映射**: 8080:8080
- **上下文路径**: /api
- **依赖**: MySQL (健康检查通过后启动)

### 前端应用

- **容器名称**: smart-medicine-box-frontend
- **端口映射**: 80:80
- **依赖**: 后端服务 (后端启动后启动)

## 环境变量

### 后端服务环境变量

| 环境变量 | 描述 | 默认值 |
|----------|------|--------|
| SPRING_DATASOURCE_URL | 数据库连接 URL | jdbc:mysql://mysql:3306/smart_medicine_box?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8 |
| SPRING_DATASOURCE_USERNAME | 数据库用户名 | root |
| SPRING_DATASOURCE_PASSWORD | 数据库密码 | 123456 |
| MQTT_BROKER_URL | MQTT Broker 地址 | tcp://mosquitto:1883 |

## 停止和重启服务

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 重新构建并启动

```bash
docker-compose up -d --build
```

## 数据持久化

- **MySQL 数据**: 存储在 `mysql-data` Docker 卷中，容器删除后数据不会丢失
- **配置文件**: 映射到本地文件系统，便于修改和维护

## 开发模式

如果您需要在开发模式下运行服务，可以：

1. 单独启动 MySQL 和 Mosquitto 服务
   ```bash
   docker-compose up -d mysql mosquitto
   ```

2. 在本地运行后端和前端服务
   - 后端: `cd backend && mvn spring-boot:run`
   - 前端: `cd frontend && npm start`

## 设备连接

1. 确保您的 IoT 设备（Arduino + ESP8266）与 Docker 主机在同一网络
2. 在设备代码中配置 MQTT Broker 地址为 Docker 主机的 IP 地址
3. 配置 MQTT 端口为 1883
4. 设备将自动连接到 MQTT Broker 并接收配置

## 常见问题

### 1. 服务启动失败

查看日志以获取详细错误信息：
```bash
docker-compose logs -f
```

### 2. 数据库连接失败

确保 MySQL 服务已成功启动：
```bash
docker-compose ps mysql
```

### 3. MQTT 连接失败

确保 Mosquitto 服务已成功启动：
```bash
docker-compose ps mosquitto
```

### 4. 前端无法访问后端 API

检查 Nginx 配置和后端服务状态：
```bash
docker-compose logs frontend
```

## 升级指南

1. 停止当前服务
   ```bash
docker-compose down
   ```

2. 更新项目代码

3. 重新构建并启动服务
   ```bash
docker-compose up -d --build
   ```

## 安全建议

- 在生产环境中，修改 MySQL 密码为强密码
- 禁用 Mosquitto 的匿名连接，配置用户名和密码
- 配置 HTTPS 支持
- 配置防火墙规则，限制外部访问

## 许可证

[MIT License](LICENSE)
