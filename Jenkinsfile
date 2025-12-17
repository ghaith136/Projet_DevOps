pipeline {
    agent any

    environment {
        IMAGE_NAME = "monapp:latest"
        CONTAINER_NAME = "monapp-container"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code récupéré depuis GitHub'
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
                echo 'Dépendances installées'
            }
        }

        stage('Build') {
            steps {
                // Pas de script build nécessaire pour ton app simple
                echo 'Pas de compilation nécessaire (app Express simple) - stage skipped'
            }
        }

        stage('Test') {
            steps {
                // Pas de tests unitaires pour l'exemple, on skip
                echo 'Pas de tests unitaires définis - stage skipped'
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t %IMAGE_NAME% .'
                echo 'Image Docker construite'
            }
        }

        stage('Docker Run') {
            steps {
                bat '''
                docker rm -f %CONTAINER_NAME% || exit 0
                docker run -d -p 3000:3000 --name %CONTAINER_NAME% %IMAGE_NAME%
                '''
                sleep 20
                echo 'Container lancé sur port 3000'
            }
        }

        stage('Smoke Test') {
            steps {
                bat '''
                echo Test de l\'endpoint racine...
                curl -f http://localhost:3000/ || exit 1

                echo Test de l\'endpoint /weather...
                curl -f http://localhost:3000/weather || exit 1

                echo Smoke Test PASSED !
                '''
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
                echo 'Artefacts archivés'
            }
        }
    }

    post {
        always {
            bat 'docker stop %CONTAINER_NAME% || exit 0'
            bat 'docker rm %CONTAINER_NAME% || exit 0'
            echo 'Nettoyage final terminé'
        }
        success {
            echo 'PIPELINE PR : PASSED ✅'
        }
        failure {
            echo 'PIPELINE PR : FAILED ❌'
        }
    }
}
