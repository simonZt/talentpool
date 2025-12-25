pipeline {
    agent any

    tools {
        nodejs 'NodeJS-18'
    }

    environment {
        SERVER_IP = '8.137.37.22'
        SERVER_USER = 'root'
        SERVER_CRED_ID = 'aliyun-server-cred'
        SERVER_APP_DIR = '/opt/talentpool'
        FRONTEND_IMAGE = 'talentpool-frontend'
        BACKEND_IMAGE = 'talentpool-backend'
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
                    sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_VERSION} --no-cache ."
                    sh "docker tag ${FRONTEND_IMAGE}:${IMAGE_VERSION} ${FRONTEND_IMAGE}:latest"
                    echo "前端 Docker 镜像 ${FRONTEND_IMAGE}:${IMAGE_VERSION} 构建完成！"
                }
            }
        }

        stage('3. Build Backend (Python) Docker Image') {
            steps {
                echo '--- 步骤3: 构建后端 Python 镜像 ---'
                dir('backend') {
                    sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_VERSION} ."
                    sh "docker tag ${BACKEND_IMAGE}:${IMAGE_VERSION} ${BACKEND_IMAGE}:latest"
                    echo "后端 Docker 镜像 ${BACKEND_IMAGE}:${IMAGE_VERSION} 构建完成！"
                }
            }
        }

        stage('4. Deploy Docker Images to Server') {
            steps {
                echo '--- 步骤4: 部署 Docker 镜像到阿里云服务器 ---'
                script {
                    echo '保存 Docker 镜像为 tar 文件...'
                    sh "docker save -o frontend-image.tar ${FRONTEND_IMAGE}:${IMAGE_VERSION}"
                    sh "docker save -o backend-image.tar ${BACKEND_IMAGE}:${IMAGE_VERSION}"

                    echo '传输镜像文件到服务器...'
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh "scp -o StrictHostKeyChecking=no frontend-image.tar ${SERVER_USER}@${SERVER_IP}:${SERVER_APP_DIR}/"
                        sh "scp -o StrictHostKeyChecking=no backend-image.tar ${SERVER_USER}@${SERVER_IP}:${SERVER_APP_DIR}/"
                    }

                    echo '在服务器上加载镜像、强制清理旧容器、重启服务...'
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "
                                set -e
                                cd ${SERVER_APP_DIR}

                                echo '【强制清理】停止并删除旧容器...'
                                docker stop talentpool-frontend talentpool-backend 2>/dev/null || true
                                docker rm -f talentpool-frontend talentpool-backend 2>/dev/null || true

                                echo '【强制清理】清理未使用的镜像和容器...'
                                docker image prune -f
                                docker container prune -f

                                echo '【强制清理】清理网络...'
                                docker network rm talentpool_default 2>/dev/null || true

                                echo '加载前端镜像...'
                                docker load -i frontend-image.tar
                                echo '加载后端镜像...'
                                docker load -i backend-image.tar

                                echo '使用 Docker Compose 重启服务...'

                                if [ ! -f docker-compose.yml ]; then
                                    echo '错误：docker-compose.yml 文件不存在！'
                                    exit 1
                                fi

                                docker-compose down
                                docker-compose up -d --build

                                echo '等待服务启动...'
                                sleep 10

                                echo '检查服务状态...'
                                docker-compose ps

                                echo '测试后端接口...'
                                curl -f http://localhost:8000/api/dashboard/stats || echo '后端测试失败，但继续执行'

                                echo '清理服务器上的临时镜像文件...'
                                rm -f frontend-image.tar backend-image.tar
                                echo '部署完成！'
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
            cleanWs()
            sh 'rm -f backend-image.tar frontend-image.tar 2>/dev/null || true'
        }

        success {
            echo '--- 构建成功！ ---'
            echo '前端镜像: talentpool-frontend:' + IMAGE_VERSION
            echo '后端镜像: talentpool-backend:' + IMAGE_VERSION
            echo '服务器: ' + SERVER_IP
        }

        failure {
            echo '--- 构建失败！ ---'
            echo '请检查日志并修复问题后重试'
        }
    }
}
