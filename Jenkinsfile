pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    triggers {
        // À remplacer par webhook GitHub si disponible
        pollSCM('H/5 * * * *')
    }

    environment {
        APP_NAME     = "monapp"
        DOCKER_IMAGE = "monapp:%BUILD_NUMBER%"
        CONTAINER    = "monapp-%BUILD_NUMBER%"
    }

    stages {

        /* ================= CHECKOUT ================= */
        stage('Checkout') {
            steps {
                echo "Checkout du code source"
                checkout scm
            }
        }

        /* ================= SETUP ================= */
        stage('Setup') {
            steps {
                echo "Installation des dépendances"
                bat '''
                node -v
                npm -v
                npm install
                '''
            }
        }

        /* ================= BUILD ================= */
        stage('Build') {
            steps {
                echo "Build de l'application"
                bat 'npm run build'
            }
        }

        /* ================= DOCKER BUILD & RUN ================= */
        stage('Docker Build & Run') {
            steps {
                echo "Build et lancement Docker"
                bat '''
                REM Nettoyage préventif
                docker stop %CONTAINER% >nul 2>&1
                docker rm   %CONTAINER% >nul 2>&1

                REM Build image
                docker build -t %DOCKER_IMAGE% .

                REM Run container
                docker run -d --name %CONTAINER% -p 3000:3000 %DOCKER_IMAGE%

                exit /b 0
                '''
            }
        }

        /* ================= SMOKE TEST ================= */
        stage('Smoke Test') {
            steps {
                echo "Smoke Test HTTP"
                bat '''
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
            steps {
                echo "Archivage des artefacts"
                archiveArtifacts artifacts: '**/build/**', fingerprint: true
                archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
            }
        }

        /* ================= CLEANUP ================= */
        stage('Cleanup') {
            steps {
                echo "Cleanup Docker"
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
            echo "✅ BUILD DEV RÉUSSI"
        }
        failure {
            echo "❌ BUILD DEV ÉCHOUÉ"
        }
        always {
            cleanWs()
        }
    }
}
