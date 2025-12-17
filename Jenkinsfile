pipeline {

    agent any

    environment {
        APP_NAME = "monapp"
        IMAGE_TAG = "dev-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp"
    }

    options {
        timestamps()
    }

    stages {

        stage('Start') {
            steps {
                bat 'echo START'
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
                bat 'echo CHECKOUT OK'
            }
        }

        stage('Setup') {
            steps {
                bat 'npm install'
                bat 'echo SETUP OK'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
                bat 'echo BUILD OK'
            }
        }

        stage('Docker Build & Run') {
            steps {
                script {
                    // IGNORER les erreurs Docker
                    bat(returnStatus: true, script: "docker stop ${CONTAINER_NAME}")
                    bat(returnStatus: true, script: "docker rm ${CONTAINER_NAME}")
                }

                bat """
                echo ===== Docker Build =====
                docker build -t %APP_NAME%:%IMAGE_TAG% .

                echo ===== Docker Run =====
                docker run -d --name %CONTAINER_NAME% -p 3000:3000 %APP_NAME%:%IMAGE_TAG%
                """
            }
        }

        stage('Smoke Test') {
            steps {
                bat """
                echo ===== Smoke Test =====
                curl http://localhost:3000 || exit /b 1
                """
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
            }
        }

        stage('Cleanup') {
            steps {
                script {
                    bat(returnStatus: true, script: "docker stop ${CONTAINER_NAME}")
                    bat(returnStatus: true, script: "docker rm ${CONTAINER_NAME}")
                }
            }
        }

        stage('End') {
            steps {
                bat 'echo PIPELINE FINISHED'
            }
        }
    }

    post {
        success {
            bat 'echo PIPELINE SUCCESS'
        }
        failure {
            bat 'echo PIPELINE FAILED'
        }
        always {
            cleanWs()
        }
    }
}
