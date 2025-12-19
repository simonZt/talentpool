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
        SERVER_IP = '8.137.37.22'
        SERVER_USER = 'root'
        SERVER_CRED_ID = 'aliyun-server-cred' // 确保这个ID在Jenkins Credentials中存在
        SERVER_APP_DIR = '/opt/talentpool'

        // 镜像名称和标签
        FRONTEND_IMAGE = 'talentpool-frontend'
        BACKEND_IMAGE = 'talentpool-backend'
        // 使用 Jenkins 内置的 BUILD_ID 作为版本号，确保每次构建唯一
        IMAGE_VERSION = "${env.BUILD_ID}"
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo '--- 步骤1: 拉取代码 (浅克隆) ---'
                timeout(time: 20, unit: 'MINUTES') {
                    checkout changelog: false,
                            scm: [
                                $class: 'GitSCM',
                                branches: [[name: '*/main']],
                                doGenerateSubmoduleConfigurations: false,
                                extensions: [[$class: 'CloneOption', depth: 1, noTags: true, shallow: true]],
                                userRemoteConfigs: [[url: 'https://github.com/simonZt/talentpool.git', credentialsId: '906808f7-546e-4b91-9023-7e97eb641f90']]
                            ]
                }
            }
        }

        stage('2. Build Frontend (Vue3) Docker Image') {
            steps {
                echo '--- 步骤2: 构建前端 Docker 镜像 ---'
                dir('frontend') {
                    // 构建 Docker 镜像，并打上版本标签
                    sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_VERSION} --no-cache ."
                    // 同时也打一个 latest 标签，方便服务器上的 docker-compose 使用
                    sh "docker tag ${FRONTEND_IMAGE}:${IMAGE_VERSION} ${FRONTEND_IMAGE}:latest"
                    echo "前端 Docker 镜像 ${FRONTEND_IMAGE}:${IMAGE_VERSION} 构建完成！"
                }
            }
        }

        stage('3. Build Backend (Python) Docker Image') {
            steps {
                echo '--- 步骤3: 构建后端 Python 镜像 ---'
                dir('backend') {
                    // 构建后端镜像并打上版本标签
                    sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_VERSION} ."
                    // 同样打一个 latest 标签
                    sh "docker tag ${BACKEND_IMAGE}:${IMAGE_VERSION} ${BACKEND_IMAGE}:latest"
                    echo "后端 Docker 镜像 ${BACKEND_IMAGE}:${IMAGE_VERSION} 构建完成！"
                }
            }
        }

        stage('4. Deploy Docker Images to Server') {
            steps {
                echo '--- 步骤4: 部署 Docker 镜像到阿里云服务器 ---'
                script {
                    // 4.1 保存 Docker 镜像为 tar 文件
                    echo '保存 Docker 镜像为 tar 文件...'
                    sh "docker save -o frontend-image.tar ${FRONTEND_IMAGE}:${IMAGE_VERSION}"
                    sh "docker save -o backend-image.tar ${BACKEND_IMAGE}:${IMAGE_VERSION}"

                    // 4.2 使用 ssh-agent 传输镜像文件到服务器
                    echo '传输镜像文件到服务器...'
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh "scp -o StrictHostKeyChecking=no frontend-image.tar ${SERVER_USER}@${SERVER_IP}:${SERVER_APP_DIR}/"
                        sh "scp -o StrictHostKeyChecking=no backend-image.tar ${SERVER_USER}@${SERVER_IP}:${SERVER_APP_DIR}/"
                    }

                    // 4.3 在服务器上加载镜像并使用 docker-compose 启动服务
                    echo '在服务器上加载镜像并重启服务...'
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "
                                set -e # 如果任何命令失败则立即退出脚本

                                # 进入应用目录
                                cd ${SERVER_APP_DIR}

                                # 加载镜像
                                echo '加载前端镜像...'
                                docker load -i frontend-image.tar
                                echo '加载后端镜像...'
                                docker load -i backend-image.tar

                                # 使用 docker-compose 重启服务
                                # 前提：服务器上必须存在 /opt/talentpool/docker-compose.yml 文件
                                echo '使用 Docker Compose 重启服务...'
                                docker-compose down
                                docker-compose up -d --build

                                # 清理服务器上的 tar 文件，节省空间
                                echo '清理服务器上的临时镜像文件...'
                                rm -f frontend-image.tar backend-image.tar
                            "
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo '--- 流水线执行完毕，清理工作空间 ---'
            // 清理工作空间和 Jenkinsfile 同级目录下的 tar 文件
            cleanWs()
            sh 'rm -f backend-image.tar frontend-image.tar'
        }
    }
}
