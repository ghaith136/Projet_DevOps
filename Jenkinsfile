pipeline {
    agent any

    environment {
        // Définir des variables si nécessaire
        APP_NAME = 'MonApp'
        IMAGE_NAME = 'monapp:latest'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Récupération du code depuis GitHub...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installation des dépendances...'
                bat 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo 'Compilation / Build de l’application...'
                bat 'npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Lancement des tests...'
                bat 'npm test'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Construction de l’image Docker...'
                bat 'docker build -t %IMAGE_NAME% .'
            }
        }

        stage('Docker Run') {
            steps {
                echo 'Démarrage du conteneur Docker...'
                bat 'docker run -d -p 3000:3000 %IMAGE_NAME%'
            }
        }
    }

    post {
        success {
            echo 'Pipeline terminé avec succès ✅'
        }
        failure {
            echo 'Pipeline échoué ❌'
        }
    }
}
