pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_NAME  = "monapp"
        IMAGE     = "monapp:%BUILD_NUMBER%"
        CONTAINER = "monapp-%BUILD_NUMBER%"
    }

    stages {

        /* ================= CHECKOUT ================= */
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        /* ================= SETUP ================= */
        stage('Setup') {
            steps {
                bat '''
                echo === Setup Node ===
                node -v
                npm -v
                npm install
                '''
            }
        }

        /* ================= BUILD ================= */
        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }

        /* ================= DOCKER BUILD & RUN ================= */
        stage('Docker Build & Run') {
            when {
                anyOf {
                    branch 'dev'
                    buildingTag()
                }
            }
            steps {
                bat '''
                echo === Docker Cleanup ===
                docker stop %CONTAINER% >nul 2>&1
                docker rm   %CONTAINER% >nul 2>&1

                echo === Docker Build ===
                docker build -t %IMAGE% .

                echo === Docker Run ===
                docker run -d --name %CONTAINER% -p 3000:3000 %IMAGE%

                exit /b 0
                '''
            }
        }

        /* ================= SMOKE TEST ================= */
        stage('Smoke Test') {
            when {
                anyOf {
                    branch 'dev'
                    expression { env.CHANGE_ID != null }
                }
            }
            steps {
                bat '''
                echo === Smoke Test ===
                powershell -Command "
                try {
                    $r = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 10
                    if ($r.StatusCode -ne 200) { exit 1 }
                } catch {
                    exit 1
                }
                "
                '''
            }
        }

        /* ================= ARCHIVE ================= */
        stage('Archive Artifacts') {
            when {
                anyOf {
                    branch 'dev'
                    buildingTag()
                }
            }
            steps {
                archiveArtifacts artifacts: '**/build/**', fingerprint: true
                archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
            }
        }

        /* ================= CLEANUP ================= */
        stage('Cleanup') {
            steps {
                bat '''
                docker stop %CONTAINER% >nul 2>&1
                docker rm   %CONTAINER% >nul 2>&1
                exit /b 0
                '''
            }
        }
    }

    post {
        success {
            echo '✅ PIPELINE SUCCEEDED'
        }
        failure {
            echo '❌ PIPELINE FAILED'
        }
        always {
            cleanWs()
        }
    }
}
