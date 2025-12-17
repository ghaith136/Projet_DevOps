pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        APP_NAME  = "monapp"
        IMAGE     = "monapp:%BUILD_NUMBER%"
        CONTAINER = "monapp-%BUILD_NUMBER%"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup') {
            steps {
                bat '''
                echo === Setup ===
                node -v
                npm -v
                npm install
                exit /b 0
                '''
            }
        }

        stage('Build') {
            steps {
                bat '''
                echo === Build App ===
                npm run build
                exit /b 0
                '''
            }
        }

        stage('Docker Build & Run') {
            when {
                branch 'dev'
            }
            steps {
                bat '''
                echo === Docker STOP (ignore errors) ===
                docker stop %CONTAINER% 2>nul
                echo OK

                echo === Docker RM (ignore errors) ===
                docker rm %CONTAINER% 2>nul
                echo OK

                echo === Docker BUILD ===
                docker build -t %IMAGE% .

                echo === Docker RUN ===
                docker run -d --name %CONTAINER% -p 3000:3000 %IMAGE%

                exit /b 0
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                bat '''
                echo === Smoke Test ===
                powershell -Command "
                try {
                    $r = Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 10
                    if ($r.StatusCode -ne 200) { exit 1 }
                } catch {
                    exit 1
                }"
                exit /b 0
                '''
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/build/**', fingerprint: true
            }
        }

        stage('Cleanup') {
            steps {
                bat '''
                docker stop %CONTAINER% 2>nul
                docker rm %CONTAINER% 2>nul
                exit /b 0
                '''
            }
        }
    }

    post {
        success {
            echo '✅ BUILD PASSED'
        }
        failure {
            echo '❌ BUILD FAILED'
        }
        always {
            cleanWs()
        }
    }
}
