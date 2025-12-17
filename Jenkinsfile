pipeline {
    agent any

    environment {
        APP_NAME = "mon_app"
        DOCKER_IMAGE = "mon_app:${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                echo "Installation dépendances"
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo "Build de l’application"
                sh 'npm run build'
            }
        }

        stage('Docker Build & Run') {
            parallel {
                stage('Build Docker') {
                    steps {
                        sh "docker build -t ${DOCKER_IMAGE} ."
                    }
                }
                stage('Run Docker') {
                    steps {
                        sh "docker run -d --name ${APP_NAME}_${BUILD_NUMBER} -p 3000:3000 ${DOCKER_IMAGE}"
                    }
                }
            }
        }

        stage('Smoke Test') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'feature/*'
                }
            }
            steps {
                echo "Smoke Test"
                script {
                    def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", returnStdout: true).trim()
                    if (status != "200") {
                        error "Smoke test failed"
                    }
                }
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: 'build/**', fingerprint: true
            }
        }

        stage('Cleanup') {
            steps {
                sh "docker rm -f ${APP_NAME}_${BUILD_NUMBER} || true"
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
