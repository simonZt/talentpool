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

        stage('2. Deploy & Build on Server') {
            steps {
                echo '--- 步骤2: 部署到服务器（在服务器上构建） ---'
                script {
                    // 只压缩 frontend 和 backend，不包含 docker-compose.yml
                    echo '压缩代码...'
                    sh 'tar -czf talentpool.tar.gz --exclude=.git --exclude=node_modules frontend/ backend/'

                    echo '传输代码到服务器...'
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh "scp -o StrictHostKeyChecking=no talentpool.tar.gz ${SERVER_USER}@${SERVER_IP}:${SERVER_APP_DIR}/"
                    }

                    echo '在服务器上构建并部署...'
                    sshagent(credentials: [SERVER_CRED_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "
                                set -e
                                cd ${SERVER_APP_DIR}

                                echo '解压代码...'
                                rm -rf frontend backend 2>/dev/null || true
                                tar -xzf talentpool.tar.gz

                                echo '【强制清理】停止并删除旧容器...'
                                docker stop talentpool-frontend talentpool-backend 2>/dev/null || true
                                docker rm -f talentpool-frontend talentpool-backend 2>/dev/null || true

                                echo '【强制清理】清理旧镜像...'
                                docker image prune -a -f --filter "until=24h"

                                echo '构建前端镜像...'
                                cd frontend
                                docker build -t ${FRONTEND_IMAGE}:latest . --no-cache
                                cd ..

                                echo '构建后端镜像...'
                                cd backend
                                docker build -t ${BACKEND_IMAGE}:latest . --no-cache
                                cd ..

                                echo '使用现有 docker-compose.yml 启动服务...'
                                docker-compose down
                                docker-compose up -d --build

                                echo '等待服务启动...'
                                sleep 15

                                echo '检查服务状态...'
                                docker-compose ps

                                echo '测试后端接口...'
                                curl -f http://localhost:8000/api/dashboard/stats && echo '✅ 服务正常' || echo '⚠️ 服务异常'

                                echo '清理临时文件...'
                                rm -f talentpool.tar.gz
                                echo '✅ 部署完成！'
                            "
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo '--- 清理 Jenkins工作空间 ---'
            cleanWs()
            sh 'rm -f talentpool.tar.gz 2>/dev/null || true'
        }

        success {
            echo '--- ✅ 部署成功！ ---'
            echo '服务器: ' + SERVER_IP
            echo '前端镜像: talentpool-frontend:latest'
            echo '后端镜像: talentpool-backend:latest'
        }

        failure {
            echo '--- ❌ 部署失败！ ---'
            echo '可能原因：'
            echo '1. Git 仓库代码问题'
            echo '2. 服务器网络问题'
            echo '3. Docker 构建失败'
            echo '请检查日志并修复问题后重试'
        }
    }
}
