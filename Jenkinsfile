pipeline {

    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_NAME = "monapp"
        IMAGE_TAG = "dev-${BUILD_NUMBER}"
        CONTAINER_NAME = "monapp"
    }

    options {
        timestamps()
    }

    stages {

        /* ============================
           1. CHECKOUT
        ============================ */
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        /* ============================
           2. SETUP
        ============================ */
        stage('Setup') {
            steps {
                bat 'node -v'
                bat 'npm -v'
                bat 'npm install'
            }
        }

        /* ============================
           3. BUILD
        ============================ */
        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }

        /* ============================
           4. DOCKER BUILD & RUN
        ============================ */
        stage('Docker Build & Run') {
            steps {
                script {
                    // Ignore errors if container does not exist
                    bat(returnStatus: true, script: "docker stop %CONTAINER_NAME%")
                    bat(returnStatus: true, script: "docker rm %CONTAINER_NAME%")
                }

                bat """
                echo ===== Docker Build =====
                docker build -t %APP_NAME%:%IMAGE_TAG% .

                echo ===== Docker Run =====
                docker run -d --name %CONTAINER_NAME% -p 3000:3000 %APP_NAME%:%IMAGE_TAG%
                """
            }
        }

        /* ============================
           5. SMOKE TEST
        ============================ */
        stage('Smoke Test') {
            steps {
                bat """
                echo ===== Smoke Test =====
                curl http://localhost:3000 || exit /b 1
                """
            }
        }

        /* ============================
           6. ARCHIVE ARTIFACTS
        ============================ */
        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
            }
        }

        /* ============================
           7. CLEANUP
        ============================ */
        stage('Cleanup') {
            steps {
                script {
                    bat(returnStatus: true, script: "docker stop %CONTAINER_NAME%")
                    bat(returnStatus: true, script: "docker rm %CONTAINER_NAME%")
                }
            }
        }
    }

    post {
        success {
            echo '✅ Build DEV SUCCESS'
        }
        failure {
            echo '❌ Build DEV FAILED'
        }
        always {
            cleanWs()
        }
    }
}
