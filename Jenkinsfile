pipeline {
    agent none

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        DOCKER_HUB_USERNAME = 'lalith31'
        BACKEND_IMAGE       = "${DOCKER_HUB_USERNAME}/task-manager-backend"
        FRONTEND_IMAGE      = "${DOCKER_HUB_USERNAME}/task-manager-frontend"
        IMAGE_TAG           = "${BUILD_NUMBER}"
        DOCKER_CREDENTIALS  = 'dockerhub-credentials-id'
    }

    stages {

        stage('Checkout SCM') {
            agent any
            steps {
                checkout scm
                echo "Code checked out at commit: ${GIT_COMMIT}"
                sh 'ls -la'
            }
        }

        stage('Init & Validate') {
            agent {
                docker {
                    image 'docker:latest'
                    args '-v /var/run/docker.sock:/var/run/docker.sock -e HOME=/tmp'
                }
            }
            steps {
                echo "Build #${BUILD_NUMBER} | Branch: ${GIT_BRANCH}"
                sh 'docker version'
                sh '''
                    test -d ./backend  || (echo "backend/ missing"  && exit 1)
                    test -d ./frontend || (echo "frontend/ missing" && exit 1)
                    echo "Project structure OK"
                '''
            }
        }

        stage('Build Images') {
            parallel {

                stage('Build Backend') {
                    agent {
                        docker {
                            image 'docker:latest'
                            args '-v /var/run/docker.sock:/var/run/docker.sock -e HOME=/tmp'
                        }
                    }
                    steps {
                        sh '''
                            docker build \
                                --tag  ${BACKEND_IMAGE}:${IMAGE_TAG} \
                                --tag  ${BACKEND_IMAGE}:latest \
                                --file ./backend/Dockerfile \
                                ./backend
                            echo "Backend image built"
                        '''
                    }
                }

                stage('Build Frontend') {
                    agent {
                        docker {
                            image 'docker:latest'
                            args '-v /var/run/docker.sock:/var/run/docker.sock -e HOME=/tmp'
                        }
                    }
                    steps {
                        sh '''
                            docker build \
                                --tag  ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                                --tag  ${FRONTEND_IMAGE}:latest \
                                --file ./frontend/Dockerfile \
                                ./frontend
                            echo "Frontend image built"
                        '''
                    }
                }

            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'docker:latest'
                    args '-v /var/run/docker.sock:/var/run/docker.sock -e HOME=/tmp'
                }
            }
            steps {
                sh '''
                    docker run -d \
                        --name backend-test-${BUILD_NUMBER} \
                        -p 3001:3001 \
                        ${BACKEND_IMAGE}:${IMAGE_TAG}

                    sleep 10

                    docker exec backend-test-${BUILD_NUMBER} \
                        wget -qO- http://localhost:3001/health

                    echo "Health check passed!"
                '''
            }
            post {
                always {
                    sh '''
                        docker stop  backend-test-${BUILD_NUMBER} || true
                        docker rm -f backend-test-${BUILD_NUMBER} || true
                    '''
                }
            }
        }

        stage('Push Images') {
            agent {
                docker {
                    image 'docker:latest'
                    args '-v /var/run/docker.sock:/var/run/docker.sock -e HOME=/tmp'
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
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${BACKEND_IMAGE}:latest
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        docker push ${FRONTEND_IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }

    }   // ← FIX 1: this closing brace for stages{} was missing

    post {
        always {
            echo "Pipeline finished — Build #${BUILD_NUMBER}"
        }
        success {
            echo "SUCCESS — Images pushed: ${BACKEND_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo "FAILED — Check stage logs above"
        }
        cleanup {
            node('built-in') {   // ← FIX 2: wrap sh in node block
                sh 'docker image prune -f || true'
            }
        }
    }
}