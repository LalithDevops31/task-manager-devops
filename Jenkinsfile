pipeline {
    agent none

    options {
        timeout(time: 30, unit: 'MINUTES')   // kill the build if it hangs
        disableConcurrentBuilds()            // queue builds — prevents port clashes on agent
    }

    environment {
        DOCKER_HUB_USERNAME = 'lalith31'
        BACKEND_IMAGE       = "${DOCKER_HUB_USERNAME}/task-manager-backend"
        FRONTEND_IMAGE      = "${DOCKER_HUB_USERNAME}/task-manager-frontend"
        IMAGE_TAG           = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS  = 'dockerhub-credentials-id'
    }

    stages {

        // ─────────────────────────────────────────
        // STAGE 1: Checkout
        // ─────────────────────────────────────────
        stage('Checkout SCM') {
            agent any
            steps {
                checkout scm
                echo "✅ Code checked out at commit: ${GIT_COMMIT}"
                sh 'ls -la'
            }
        }

        // ─────────────────────────────────────────
        // STAGE 2: Init / Validate
        // ─────────────────────────────────────────
        stage('Init & Validate') {
            agent {
                docker {
                    image 'docker:latest'
                    args  '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                echo "🔍 Build #${BUILD_NUMBER} | Branch: ${GIT_BRANCH}"
                sh 'docker version'
                sh 'docker info'
                sh '''
                    echo "Checking project structure..."
                    test -d ./backend  || (echo "❌ backend/ folder missing!"  && exit 1)
                    test -d ./frontend || (echo "❌ frontend/ folder missing!" && exit 1)
                    echo "✅ Project structure looks good"
                '''
            }
        }

        // ─────────────────────────────────────────
        // STAGE 3 + 4: Build Backend & Frontend (PARALLEL)
        // ─────────────────────────────────────────
        stage('Build Images') {
            parallel {

                stage('Build Backend') {
                    agent {
                        docker {
                            image 'docker:latest'
                            args  '-v /var/run/docker.sock:/var/run/docker.sock'
                        }
                    }
                    steps {
                        sh '''
                            echo "🔨 Building backend image..."
                            docker build \
                                --tag  ${BACKEND_IMAGE}:${IMAGE_TAG} \
                                --tag  ${BACKEND_IMAGE}:latest \
                                --file ./backend/Dockerfile \
                                --label "build.number=${BUILD_NUMBER}" \
                                --label "git.commit=${GIT_COMMIT}" \
                                ./backend
                            echo "✅ Backend image built: ${BACKEND_IMAGE}:${IMAGE_TAG}"
                        '''
                    }
                }

                stage('Build Frontend') {
                    agent {
                        docker {
                            image 'docker:latest'
                            args  '-v /var/run/docker.sock:/var/run/docker.sock'
                        }
                    }
                    steps {
                        sh '''
                            echo "🔨 Building frontend image..."
                            docker build \
                                --tag  ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                                --tag  ${FRONTEND_IMAGE}:latest \
                                --file ./frontend/Dockerfile \
                                --label "build.number=${BUILD_NUMBER}" \
                                --label "git.commit=${GIT_COMMIT}" \
                                ./frontend
                            echo "✅ Frontend image built: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
                        '''
                    }
                }

            }
        }

        // ─────────────────────────────────────────
        // STAGE 5: Test
        // ─────────────────────────────────────────
        stage('Test') {
            agent {
                docker {
                    image 'docker:latest'
                    args  '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                sh '''
                    echo "🧪 Starting backend test container..."
                    docker run -d \
                        --name  backend-test-${BUILD_NUMBER} \
                        --env   NODE_ENV=test \
                        -p      3001:3000 \
                        ${BACKEND_IMAGE}:${IMAGE_TAG}

                    echo "⏳ Waiting for backend to start..."
                    sleep 10

                    echo "🔍 Hitting /health endpoint..."
                    docker exec backend-test-${BUILD_NUMBER} \
                        wget -qO- http://localhost:3000/health || \
                        curl -f   http://localhost:3000/health

                    echo "✅ Health check passed!"
                '''
            }
            post {
                always {
                    sh '''
                        echo "🧹 Cleaning up test container..."
                        docker stop   backend-test-${BUILD_NUMBER} || true
                        docker rm -f  backend-test-${BUILD_NUMBER} || true
                    '''
                }
            }
        }

        // ─────────────────────────────────────────
        // STAGE 6: Push to Registry
        // ─────────────────────────────────────────
        stage('Push Images') {
            agent {
                docker {
                    image 'docker:latest'
                    args  '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${DOCKER_CREDENTIALS}",
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "🔐 Logging into Docker Hub..."
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        echo "📦 Pushing backend..."
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest

                        echo "📦 Pushing frontend..."
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest

                        echo "✅ All images pushed!"
                    '''
                }
            }
            post {
                always {
                    // Logout lives here — runs even if the push fails mid-way
                    sh 'docker logout || true'
                }
            }
        }
    }

    post {
        always {
            echo "📋 Pipeline finished — Build #${BUILD_NUMBER}"
        }
        success {
            echo "🎉 SUCCESS — Images pushed: ${BACKEND_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo "🔥 FAILED — Check stage logs above for errors"
        }
        cleanup {
            sh 'docker image prune -f || true'
        }
    }
}