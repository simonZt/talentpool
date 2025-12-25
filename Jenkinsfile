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
                echo '--- 步骤2: 部署到服务器（在服务器上构建，避免本地内存不足） ---'
                script {
                    //先压缩代码并传输到服务器
                    echo '压缩代码...'
                    sh 'tar -czf talentpool.tar.gz --exclude=.git --exclude=frontend/node_modules frontend/ backend/ docker-compose.yml 2>/dev/null || tar -czf talentpool.tar.gz frontend/ backend/ docker-compose.yml'

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

                                # 1. 解压代码
                                echo '解压代码...'
                                rm -rf old_code backup2>/dev/null || true
                                mkdir -p backup
                                mv frontend backend docker-compose.yml backup/ 2>/dev/null || true
                                tar -xzf talentpool.tar.gz

                                # 2. 强制清理旧容器
                                echo '【强制清理】停止并删除旧容器...'
                                docker stop talentpool-frontend talentpool-backend 2>/dev/null || true
                                docker rm -f talentpool-frontend talentpool-backend 2>/dev/null || true

                                # 3. 清理旧镜像
                                echo '【强制清理】清理旧镜像...'
                                docker image prune -a -f --filter "until=24h"

                                # 4. 构建前端镜像
                                echo '构建前端镜像...'
                                cd frontend
                                docker build -t ${FRONTEND_IMAGE}:latest . --no-cache
                                cd ..

                                # 5. 构建后端镜像
                                echo '构建后端镜像...'
                                cd backend
                                docker build -t ${BACKEND_IMAGE}:latest . --no-cache
                                cd ..

                                # 6. 启动服务
                                echo '启动服务...'
                                docker-compose down
                                docker-compose up -d --build

                                # 7. 等待并验证
                                echo '等待服务启动...'
                                sleep 15

                                echo '检查服务状态...'
                                docker-compose ps

                                echo '测试后端接口...'
                                curl -f http://localhost:8000/api/dashboard/stats && echo '✅ 服务正常' || echo '⚠️ 服务异常'

                                # 8. 清理临时文件
                                echo '清理临时文件...'
                                rm -f talentpool.tar.gz
                                rm -rf backup

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
            echo '1. 网络连接问题'
            echo '2. 服务器资源不足'
            echo '3. 代码语法错误'
            echo '请检查日志并修复问题后重试'
        }
    }
}
