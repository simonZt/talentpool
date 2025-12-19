pipeline {
    // 1. 在任何可用的代理（Agent）上运行
    agent any

    // 2. 定义工具版本 (需要在 Jenkins 全局配置中预先安装)
    tools {
        // 确保这里的名称和你 Jenkins 全局配置里的 NodeJS 名称一致
        nodejs 'NodeJS-18'
    }

    // 3. 环境变量，方便统一管理
    environment {
        // 你的服务器信息
        SERVER_IP = '8.137.37.22' // 已设置
        SERVER_USER = 'root'      // 已设置
        SERVER_CRED_ID = 'aliyun-server-cred' // 确保这个ID在Jenkins Credentials中存在
        SERVER_APP_DIR = '/opt/talentpool'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo '--- 步骤1: 拉取代码 (浅克隆) ---'
                timeout(time: 20, unit: 'MINUTES') {
                    // 【关键修改】使用浅克隆解决网络超时问题
                    // changelog: false 不计算变更日志
                    // extensions: [[$class: 'CloneOption', depth: 1, noTags: true, shallow: true]] 只拉取最近1个提交
                    checkout changelog: false,
                            scm: [
                                $class: 'GitSCM',
                                branches: [[name: '*/main']], // 请确认你的主分支是 main 还是 master
                                doGenerateSubmoduleConfigurations: false,
                                extensions: [[$class: 'CloneOption', depth: 1, noTags: true, shallow: true]],
                                userRemoteConfigs: [[url: 'https://github.com/simonZt/talentpool.git', credentialsId: '906808f7-546e-4b91-9023-7e97eb641f90']]
                            ]
                }
            }
        }

        stage('2. Build Frontend (Vue3)') {
            steps {
                echo '--- 步骤2: 构建前端镜像 ---'
                // 进入前端项目目录
                dir('frontend') {
                    // 构建 Docker 镜像
                    // --no-cache 确保每次构建都重新安装依赖，避免缓存问题
                    sh 'docker build -t talentpool-frontend:latest --no-cache .'

                    // 将镜像保存为 tar 文件，方便后续传输或上传
                    sh 'docker save -o frontend-image.tar talentpool-frontend:latest'

                    echo '前端 Docker 镜像构建完成！'
                }
            }
        }

        stage('3. Build Backend (Python) Image') {
            steps {
                echo '--- 步骤3: 构建后端Python镜像 ---'
                // 假设后端代码在 talentpool-backend 目录下，且该目录包含 Dockerfile
                dir('backend') {
                    script {
                        // 明确构建步骤，并标记镜像，为后续步骤做准备
                        docker.build("talentpool-backend:${env.BUILD_ID}")
                    }
                }
            }
        }

        stage('4. Deploy to Server') {
            steps {
                echo '--- 步骤4: 部署到阿里云服务器 ---'
                script {
                    // 4.1 传输前端静态文件
                    echo "传输前端静态文件到服务器..."
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        // 目标路径 /usr/share/nginx/html/talentpool/ 必须与 Nginx 配置一致
                        sh "scp -o StrictHostKeyChecking=no -r talentpool-ui/dist/* ${SERVER_USER}@${SERVER_IP}:/usr/share/nginx/html/talentpool/"
                    }

                    // 4.2 保存并传输后端 Docker 镜像
                    echo "保存并传输后端镜像到服务器..."
                    sh "docker save talentpool-backend:${env.BUILD_ID} > backend-image.tar"
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh "scp -o StrictHostKeyChecking=no backend-image.tar ${SERVER_USER}@${SERVER_IP}:${SERVER_APP_DIR}/"
                    }

                    // 4.3 在服务器上执行部署脚本
                    echo "在服务器上执行部署脚本..."
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "
                                set -e # 如果任何命令失败则立即退出脚本

                                # 进入应用目录
                                cd ${SERVER_APP_DIR}

                                # --- 后端部署部分 ---
                                echo '加载后端 Docker 镜像...'
                                docker load -i backend-image.tar

                                echo '启动/更新后端容器...'
                                # 停止并移除旧容器 (如果存在)
                                docker stop talentpool-backend || true
                                docker rm talentpool-backend || true

                                # 运行新容器
                                # -p 8000:8000 将容器的8000端口映射到服务器的8000端口
                                docker run -d --name talentpool-backend -p 8000:8000 talentpool-backend:${env.BUILD_ID}

                                # --- Nginx 配置部分 ---
                                # 假设您已经根据我们之前的沟通，手动创建好了 /etc/nginx/conf.d/talentpool.conf
                                # 如果还没有，请现在在服务器上手动创建
                                echo '重载 Nginx...'
                                sudo nginx -s reload
                            "
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo '--- 流水线执行完毕 ---'
            // 清理工作空间和工作区的 Docker 镜像文件
            cleanWs()
            sh 'rm -f backend-image.tar frontend-image.tar'
        }
    }
}
