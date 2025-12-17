pipeline {
    agent any

    environment {
        IMAGE_NAME = "monapp:latest"
        CONTAINER_NAME = "monapp"
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Checkout') {
            steps {
                echo "Source code checked out"
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }

        stage('Test') {
            steps {
                bat 'npm run test'
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t %IMAGE_NAME% .'
            }
        }

        stage('Docker Run') {
            steps {
                bat '''
                echo Nettoyage des anciens conteneurs...
                docker rm -f %CONTAINER_NAME% || exit 0

                echo Lancement du conteneur...
                docker run -d -p 3000:3000 --name %CONTAINER_NAME% %IMAGE_NAME%
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                bat '''
                echo Attente du démarrage de l'application...
                timeout /t 5

                echo Test de l'application...
                curl http://localhost:3000 || exit 1
                '''
            }
        }

        stage('Archive Artifacts') {
            steps {
                archiveArtifacts artifacts: '**/*.log', fingerprint: true
            }
        }
    }

    post {
        always {
            echo "Nettoyage final"
            bat 'docker rm -f %CONTAINER_NAME% || exit 0'
        }

        success {
            echo "PIPELINE PR PASSED ✅"
        }

        failure {
            echo "PIPELINE PR FAILED ❌"
        }
    }
}
